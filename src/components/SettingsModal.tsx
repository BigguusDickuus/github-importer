import { useState } from "react";
import { Eye, EyeOff, ChevronDown, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { ConfirmationModal } from "./ConfirmationModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [invalidPasswordError, setInvalidPasswordError] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState(false);

  // Estados da seção Limites de uso
  const [limitsSectionOpen, setLimitsSectionOpen] = useState(false);
  const [limitAmount, setLimitAmount] = useState("");
  const [limitPeriod, setLimitPeriod] = useState("dia");
  const [limitPassword, setLimitPassword] = useState("");
  const [showLimitPassword, setShowLimitPassword] = useState(false);
  const [limitPasswordError, setLimitPasswordError] = useState(false);
  const [hasActiveLimit, setHasActiveLimit] = useState(false); // Para simular se já existe um limite ativo
  
  // Valores do limite ativo (quando hasActiveLimit = true)
  const [activeLimitAmount, setActiveLimitAmount] = useState("50");
  const [activeLimitPeriod, setActiveLimitPeriod] = useState("semana");

  // Estados da seção Privacidade
  const [privacySectionOpen, setPrivacySectionOpen] = useState(false);
  const [keepContext, setKeepContext] = useState(true);
  const [initialKeepContext, setInitialKeepContext] = useState(true); // Para detectar mudanças
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [deleteAccountPasswordError, setDeleteAccountPasswordError] = useState(false);

  // Estados da seção Dados da Conta
  const [accountDataSectionOpen, setAccountDataSectionOpen] = useState(false);
  const [fullName, setFullName] = useState("Maria Silva");
  const [email, setEmail] = useState("maria.silva@email.com");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [accountDataChanged, setAccountDataChanged] = useState(false);
  const [accountDataPassword, setAccountDataPassword] = useState("");
  const [showAccountDataPassword, setShowAccountDataPassword] = useState(false);
  const [accountDataPasswordError, setAccountDataPasswordError] = useState(false);

  const handleChangePassword = () => {
    // Reset errors
    setInvalidPasswordError(false);
    setPasswordMismatchError(false);

    // Validate current password (mock validation)
    if (currentPassword !== "senha123") { // Mock: replace with real validation
      setInvalidPasswordError(true);
      return;
    }

    // Validate new passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMismatchError(true);
      return;
    }

    // Success - reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSectionOpen(false);
    // TODO: Call API to change password
    alert("Senha alterada com sucesso!");
  };

  const handleClose = () => {
    // Reset all states when closing
    setPasswordSectionOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setInvalidPasswordError(false);
    setPasswordMismatchError(false);
    
    // Reset limits states
    setLimitsSectionOpen(false);
    setLimitAmount("");
    setLimitPeriod("dia");
    setLimitPassword("");
    setShowLimitPassword(false);
    setLimitPasswordError(false);
    
    onClose();
  };

  const handleLimitAction = () => {
    // Reset error
    setLimitPasswordError(false);

    // Validate password
    if (limitPassword !== "senha123") {
      setLimitPasswordError(true);
      return;
    }

    if (hasActiveLimit) {
      // Desativar limite
      setHasActiveLimit(false);
      setActiveLimitAmount("");
      setActiveLimitPeriod("dia");
      setLimitPassword("");
      alert("Limite desativado com sucesso!");
    } else {
      // Validar campos
      const amount = parseInt(limitAmount);
      if (!limitAmount || amount < 1 || amount > 999) {
        alert("Por favor, insira um valor entre 1 e 999");
        return;
      }

      // Ativar limite
      setHasActiveLimit(true);
      setActiveLimitAmount(limitAmount);
      setActiveLimitPeriod(limitPeriod);
      setLimitAmount("");
      setLimitPeriod("dia");
      setLimitPassword("");
      alert(`Limite ativado: ${limitAmount} créditos por ${limitPeriod}`);
    }
  };
  
  const handleDeleteAccount = () => {
    // Reset error
    setDeleteAccountPasswordError(false);

    // Validate password
    if (deleteAccountPassword !== "senha123") {
      setDeleteAccountPasswordError(true);
      return;
    }

    // TODO: Call API to delete account
    alert("Conta excluída com sucesso!");
    setDeleteAccountModalOpen(false);
    handleClose();
  };

  const handleSaveAccountData = () => {
    // Reset error
    setAccountDataPasswordError(false);

    // Validate password
    if (accountDataPassword !== "senha123") {
      setAccountDataPasswordError(true);
      return;
    }

    // TODO: Call API to update account data
    alert("Dados salvos com sucesso!");
    setAccountDataChanged(false);
  };
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Configurações"
        size="sm"
      >
        <div style={{ marginTop: '16px' }}>
          {/* Seção Troca de Senha */}
          <div className="border border-obsidian-border rounded-xl overflow-hidden">
            {/* Header da seção */}
            <button
              onClick={() => setPasswordSectionOpen(!passwordSectionOpen)}
              className="w-full flex items-center justify-between bg-night-sky/40 hover:bg-night-sky/60 transition-colors text-left"
              style={{ padding: "16px 20px" }}
            >
              <span className="text-starlight-text">Troca de senha</span>
              <ChevronDown
                className={`w-5 h-5 text-moonlight-text transition-transform ${
                  passwordSectionOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Conteúdo expandível */}
            {passwordSectionOpen && (
              <div className="bg-midnight-surface" style={{ padding: "20px" }}>
                {/* Campo: Senha atual */}
                <div style={{ marginBottom: '16px' }}>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setInvalidPasswordError(false);
                      }}
                      placeholder="Senha atual"
                      className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "12px 44px 12px 16px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-moonlight-text hover:text-starlight-text transition-colors"
                      style={{ padding: '8px' }}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {invalidPasswordError && (
                    <p className="text-blood-moon-error text-sm" style={{ marginTop: "6px" }}>
                      Senha inválida
                    </p>
                  )}
                </div>

                {/* Campo: Nova senha */}
                <div style={{ marginBottom: '16px' }}>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordMismatchError(false);
                      }}
                      placeholder="Nova senha"
                      className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "12px 44px 12px 16px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-moonlight-text hover:text-starlight-text transition-colors"
                      style={{ padding: '8px' }}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Campo: Repita a nova senha */}
                <div style={{ marginBottom: '16px' }}>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordMismatchError(false);
                      }}
                      placeholder="Repita a nova senha"
                      className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "12px 44px 12px 16px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-moonlight-text hover:text-starlight-text transition-colors"
                      style={{ padding: '8px' }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordMismatchError && (
                    <p className="text-blood-moon-error text-sm" style={{ marginTop: "6px" }}>
                      Senhas não conferem
                    </p>
                  )}
                </div>

                {/* Botão de Confirmar */}
                <Button
                  onClick={handleChangePassword}
                  className="w-full"
                  style={{ height: "44px" }}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  Alterar senha
                </Button>
              </div>
            )}
          </div>

          {/* Seção Limites de uso */}
          <div className="border border-obsidian-border rounded-xl overflow-hidden" style={{ marginTop: '16px' }}>
            {/* Header da seção */}
            <button
              onClick={() => setLimitsSectionOpen(!limitsSectionOpen)}
              className="w-full flex items-center justify-between bg-night-sky/40 hover:bg-night-sky/60 transition-colors text-left"
              style={{ padding: "16px 20px" }}
            >
              <span className="text-starlight-text">Limites de uso</span>
              <ChevronDown
                className={`w-5 h-5 text-moonlight-text transition-transform ${
                  limitsSectionOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Conteúdo expandível */}
            {limitsSectionOpen && (
              <div className="bg-midnight-surface" style={{ padding: "20px" }}>
                {/* Texto descritivo */}
                <div style={{ marginBottom: '16px' }}>
                  <p className="text-moonlight-text">
                    Usar no máximo{" "}
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={hasActiveLimit ? activeLimitAmount : limitAmount}
                      onChange={(e) => setLimitAmount(e.target.value)}
                      disabled={hasActiveLimit}
                      className={`inline-block w-20 text-center bg-night-sky border border-obsidian-border rounded-lg text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors ${
                        hasActiveLimit ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{ padding: "8px 4px", marginLeft: "4px", marginRight: "4px" }}
                    />{" "}
                    créditos por{" "}
                    <select
                      value={hasActiveLimit ? activeLimitPeriod : limitPeriod}
                      onChange={(e) => setLimitPeriod(e.target.value)}
                      disabled={hasActiveLimit}
                      className={`inline-block w-auto bg-night-sky border border-obsidian-border rounded-lg text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors ${
                        hasActiveLimit ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{ padding: "8px 12px", marginLeft: "4px" }}
                    >
                      <option value="dia">dia</option>
                      <option value="semana">semana</option>
                      <option value="mês">mês</option>
                    </select>
                  </p>
                </div>

                {/* Campo: Insira senha para confirmar */}
                <div style={{ marginBottom: '16px' }}>
                  <div className="relative">
                    <input
                      type={showLimitPassword ? "text" : "password"}
                      value={limitPassword}
                      onChange={(e) => {
                        setLimitPassword(e.target.value);
                        setLimitPasswordError(false);
                      }}
                      placeholder="Insira senha para confirmar"
                      className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: "12px 44px 12px 16px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLimitPassword(!showLimitPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-moonlight-text hover:text-starlight-text transition-colors"
                      style={{ padding: '8px' }}
                    >
                      {showLimitPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {limitPasswordError && (
                    <p className="text-blood-moon-error text-sm" style={{ marginTop: "6px" }}>
                      Senha inválida
                    </p>
                  )}
                </div>

                {/* Botão de Confirmar */}
                <Button
                  onClick={handleLimitAction}
                  className="w-full"
                  style={{ height: "44px" }}
                  disabled={hasActiveLimit ? !limitPassword : (!limitAmount || !limitPassword)}
                >
                  {hasActiveLimit ? "Desativar" : "Aplicar"}
                </Button>
              </div>
            )}
          </div>

          {/* Seção Privacidade */}
          <div className="border border-obsidian-border rounded-xl overflow-hidden" style={{ marginTop: '16px' }}>
            {/* Header da seção */}
            <button
              onClick={() => setPrivacySectionOpen(!privacySectionOpen)}
              className="w-full flex items-center justify-between bg-night-sky/40 hover:bg-night-sky/60 transition-colors text-left"
              style={{ padding: "16px 20px" }}
            >
              <span className="text-starlight-text">Privacidade</span>
              <ChevronDown
                className={`w-5 h-5 text-moonlight-text transition-transform ${
                  privacySectionOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Conteúdo expandível */}
            {privacySectionOpen && (
              <div className="bg-midnight-surface" style={{ padding: "20px" }}>
                {/* Toggle: Manter contexto */}
                <div style={{ marginBottom: keepContext !== initialKeepContext ? '16px' : '20px' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-starlight-text" style={{ marginBottom: '4px' }}>
                        Manter contexto
                      </p>
                      <p className="text-moonlight-text text-sm">
                        Analisaremos suas perguntas considerando tiragens anteriores. Se desligado, sua pergunta será analisada individualmente
                      </p>
                    </div>
                    <button
                      onClick={() => setKeepContext(!keepContext)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        keepContext ? 'bg-mystic-indigo' : 'bg-obsidian-border'
                      }`}
                      style={{ flexShrink: 0 }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          keepContext ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Botão Aplicar (só aparece quando o toggle for alterado) */}
                {keepContext !== initialKeepContext && (
                  <Button
                    onClick={() => {
                      setInitialKeepContext(keepContext);
                      alert(`Preferência salva: ${keepContext ? 'Manter contexto ativado' : 'Manter contexto desativado'}`);
                      // TODO: Call API to save preference
                    }}
                    className="w-full"
                    style={{ height: "44px", marginBottom: "20px" }}
                  >
                    Aplicar
                  </Button>
                )}

                {/* Botão: Excluir conta */}
                <div className="border-t border-obsidian-border" style={{ paddingTop: '20px' }}>
                  <Button
                    onClick={() => setDeleteAccountModalOpen(true)}
                    variant="outline"
                    className="w-full border-blood-moon-error text-blood-moon-error hover:bg-blood-moon-error/10"
                    style={{ height: "44px" }}
                  >
                    Excluir conta
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Seção Dados da Conta */}
          <div className="border border-obsidian-border rounded-xl overflow-hidden" style={{ marginTop: '16px' }}>
            {/* Header da seção */}
            <button
              onClick={() => setAccountDataSectionOpen(!accountDataSectionOpen)}
              className="w-full flex items-center justify-between bg-night-sky/40 hover:bg-night-sky/60 transition-colors text-left"
              style={{ padding: "16px 20px" }}
            >
              <span className="text-starlight-text">Dados da conta</span>
              <ChevronDown
                className={`w-5 h-5 text-moonlight-text transition-transform ${
                  accountDataSectionOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Conteúdo expandível */}
            {accountDataSectionOpen && (
              <div className="bg-midnight-surface" style={{ padding: "20px" }}>
                {/* Campo: Nome completo */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="text-moonlight-text text-sm" style={{ marginBottom: '6px', display: 'block' }}>
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setAccountDataChanged(true);
                    }}
                    className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                    style={{ padding: "12px 16px" }}
                  />
                </div>

                {/* Campo: Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="text-moonlight-text text-sm" style={{ marginBottom: '6px', display: 'block' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAccountDataChanged(true);
                    }}
                    className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                    style={{ padding: "12px 16px" }}
                  />
                </div>

                {/* Campo: Data de nascimento (opcional) */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="text-moonlight-text text-sm" style={{ marginBottom: '6px', display: 'block' }}>
                    Data de nascimento <span className="text-moonlight-text/60">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      setAccountDataChanged(true);
                    }}
                    className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                    style={{ padding: "12px 16px" }}
                  />
                  <p className="text-moonlight-text text-sm" style={{ marginTop: '6px' }}>
                    Usado para leituras personalizadas
                  </p>
                </div>

                {/* Campo: Telefone (opcional) */}
                <div style={{ marginBottom: accountDataChanged ? '16px' : '0' }}>
                  <label className="text-moonlight-text text-sm" style={{ marginBottom: '6px', display: 'block' }}>
                    Telefone <span className="text-moonlight-text/60">(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setAccountDataChanged(true);
                    }}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                    style={{ padding: "12px 16px" }}
                  />
                </div>

                {/* Campo: Senha para confirmar alterações */}
                {accountDataChanged && (
                  <div style={{ marginBottom: '16px' }}>
                    <div className="relative">
                      <input
                        type={showAccountDataPassword ? "text" : "password"}
                        value={accountDataPassword}
                        onChange={(e) => {
                          setAccountDataPassword(e.target.value);
                          setAccountDataPasswordError(false);
                        }}
                        placeholder="Insira senha para confirmar"
                        className="w-full bg-night-sky border border-obsidian-border rounded-lg text-starlight-text placeholder-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
                        style={{ padding: "12px 44px 12px 16px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccountDataPassword(!showAccountDataPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-moonlight-text hover:text-starlight-text transition-colors"
                        style={{ padding: '8px' }}
                      >
                        {showAccountDataPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {accountDataPasswordError && (
                      <p className="text-blood-moon-error text-sm" style={{ marginTop: "6px" }}>
                        Senha inválida
                      </p>
                    )}
                  </div>
                )}

                {/* Botão: Salvar alterações (só aparece quando há mudanças) */}
                {accountDataChanged && (
                  <Button
                    onClick={handleSaveAccountData}
                    className="w-full"
                    style={{ height: "44px" }}
                    disabled={!accountDataPassword}
                  >
                    Salvar alterações
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal de confirmação para excluir conta */}
      <ConfirmationModal
        isOpen={deleteAccountModalOpen}
        onClose={() => {
          setDeleteAccountModalOpen(false);
          setDeleteAccountPassword("");
          setDeleteAccountPasswordError(false);
        }}
        title="Excluir conta"
        message="Este processo é irreversível. Seus créditos serão perdidos e este email não poderá ser usado para criar novas contas. Tem certeza que deseja continuar?"
        confirmText="Excluir conta"
        cancelText="Cancelar"
        variant="danger"
        requirePassword={true}
        password={deleteAccountPassword}
        onPasswordChange={(value) => {
          setDeleteAccountPassword(value);
          setDeleteAccountPasswordError(false);
        }}
        passwordError={deleteAccountPasswordError}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
}