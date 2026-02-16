import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export function AccountSwitcher() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState("personal");

  const listQuery = trpc.accounts.list.useQuery();
  const createMutation = trpc.accounts.create.useMutation();
  const switchMutation = trpc.accounts.switchAccount.useMutation();
  const deleteMutation = trpc.accounts.delete.useMutation();

  const accounts = listQuery.data || [];
  const activeAccount = accounts.find((a) => a.id === user?.activeAccountId);

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    await createMutation.mutateAsync({
      accountName: newAccountName,
      accountType: newAccountType as "personal" | "business" | "family" | "other",
    });
    setNewAccountName("");
    setNewAccountType("personal");
    setShowNewAccount(false);
    listQuery.refetch();
  };

  const handleSwitchAccount = async (accountId: number) => {
    await switchMutation.mutateAsync({ accountId });
    listQuery.refetch();
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (confirm("Tem certeza que deseja deletar esta conta?")) {
      await deleteMutation.mutateAsync({ accountId });
      listQuery.refetch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {activeAccount?.accountName.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{activeAccount?.accountName || "Minha Conta"}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Contas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de contas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Minhas Contas</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition ${
                    account.id === user?.activeAccountId
                      ? "bg-blue-50 border-blue-300"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSwitchAccount(account.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {account.accountName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{account.accountName}</div>
                      <div className="text-xs text-gray-500 capitalize">{account.accountType}</div>
                    </div>
                  </div>
                  {account.id === user?.activeAccountId && (
                    <Badge variant="default" className="ml-2">
                      Ativa
                    </Badge>
                  )}
                  {accounts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(account.id);
                      }}
                      className="ml-2"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Adicionar nova conta */}
          {!showNewAccount ? (
            <Button
              onClick={() => setShowNewAccount(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          ) : (
            <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
              <div>
                <Label htmlFor="account-name" className="text-sm">
                  Nome da Conta
                </Label>
                <Input
                  id="account-name"
                  placeholder="Ex: Conta Pessoal"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="account-type" className="text-sm">
                  Tipo de Conta
                </Label>
                <Select value={newAccountType} onValueChange={setNewAccountType}>
                  <SelectTrigger id="account-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Pessoal</SelectItem>
                    <SelectItem value="business">Negócio</SelectItem>
                    <SelectItem value="family">Família</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateAccount}
                  disabled={!newAccountName.trim() || createMutation.isPending}
                  className="flex-1"
                >
                  Criar
                </Button>
                <Button
                  onClick={() => {
                    setShowNewAccount(false);
                    setNewAccountName("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
