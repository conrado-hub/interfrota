import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, X, DollarSign, Upload, Info, Car, Camera, MessageSquare, CheckCircle, AlertTriangle } from "lucide-react";
import Stepper from "./Stepper";
import FuelGauge from "./FuelGauge";
import PhotoUpload from "./PhotoUpload";
import DrawingCanvas from "./DrawingCanvas";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage"; // Ajuste o caminho conforme necessário
import NumericFormat from 'react-number-format';

// --- Interfaces e Tipos ---

interface CheckInOutFormProps {
  type: "checkin" | "checkout";
  idFrota: string;
  idFrotaHistorico?: string;
<<<<<<< HEAD
  condutor: string;
=======
>>>>>>> f8e2b35b90a0373886293c9ca7880edc9178621a
  onSubmit: (data: CheckInPayload | CheckOutPayload) => void;
  onCancel: () => void;
  disabled?: boolean;
  onValidateKM?: (km: string) => Promise<boolean>;
}

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

// Estrutura completa dos dados do formulário
interface FormData {
  condutor: string;
  motivo: string;
  km: string;
  combustivel: number;
  teveAbastecimento: boolean;
  valorAbastecimento: string;
  comprovanteAbastecimento: string;
  fotos: string[];
  temOcorrencia: boolean;
  desenhoAvaria: string;
  desenhoAvariaHistory: DrawPoint[][];
  descricaoOcorrencia: string;
  observacoes: string;
  chaveAPI: string;
}

<<<<<<< HEAD
// Payload para API de Check-In
=======
// JSON de retorno para Check-In
>>>>>>> f8e2b35b90a0373886293c9ca7880edc9178621a
export interface CheckInPayload {
  idFrota: string;
  Condutor: string;
  Utilizacao: string;
  CombustivelSaida: number;
  KmSaida: string;
  ObservacaoSaida: string;
  ObservacaoCheckIn: string;
  FlgCheckIn: boolean;
  imagemOcorrencia: string;
  fileEnvioOcorrencia: string[];
<<<<<<< HEAD
  desenhoAvariaHistory?: DrawPoint[][];
  chaveAPI: string;
}

// Payload para API de Check-Out
export interface CheckOutPayload {
  idFrota: string;
  Condutor: string;
=======
}

// JSON de retorno para Check-Out
export interface CheckOutPayload {
  idFrota: string;
>>>>>>> f8e2b35b90a0373886293c9ca7880edc9178621a
  idFrotaHistorico: string;
  CombustivelChegada: number;
  KMChegada: string;
  ObservacaoChegada: string;
  FlgAbastecimento: boolean;
  ValorAbastecimento: string;
  fileEnvio: string;
  ObservacaoOcorrencia: string;
  FlgOcorrencia: boolean;
  imagemOcorrencia: string;
  fileEnvioOcorrencia: string[];
<<<<<<< HEAD
  desenhoAvariaHistory?: DrawPoint[][];
  chaveAPI: string;
}

// --- Componente Principal ---

const CheckInOutForm = ({ 
  type, 
  idFrota, 
  idFrotaHistorico, 
  condutor, 
  onSubmit, 
  onCancel, 
  disabled,
  onValidateKM
}: CheckInOutFormProps) => {
  // Estado do Passo Atual (1 a 4)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Chave para o localStorage
  const storageKey = `fleet-form-${type}-${idFrota}`;
  
  // Estado dos Dados do Formulário com persistência
  const [formData, setFormData] = useLocalStorage<FormData>(storageKey, {
    chaveAPI: "",
    condutor: condutor,
=======
}

const CheckInOutForm = ({ type, idFrota, idFrotaHistorico, onSubmit, onCancel }: CheckInOutFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    condutor: "",
>>>>>>> f8e2b35b90a0373886293c9ca7880edc9178621a
    motivo: "",
    km: "",
    combustivel: 50,
    teveAbastecimento: false,
    valorAbastecimento: "",
    comprovanteAbastecimento: "",
    fotos: [],
    temOcorrencia: false,
    desenhoAvaria: "",
    desenhoAvariaHistory: [],
    descricaoOcorrencia: "",
    observacoes: "",
  });

  // Configuração dos Passos (Step Labels) mantida apenas para referência lógica se necessário
  // Mas a renderização agora usa 'stepIcons'
  const steps = ["Introdução", type === "checkin" ? "Saída" : "Chegada", "Condições", "Observações", "Finalizar"];
  
  // NOVO: Array de Ícones para substituir os números nos círculos
  const stepIcons = [
    <Info className="w-4 h-4" />,             // Passo 1: Introdução (Dados Gerais)
    <Car className="w-4 h-4" />,          // Passo 2: Saída/Chegada (KM/Combustível)
    <Camera className="w-4 h-4" />,         // Passo 3: Condições (Fotos/Avarias)
    <MessageSquare className="w-4 h-4" />, // Passo 4: Observações
    <CheckCircle className="w-4 h-4" />     // Passo 5: Finalizar
  ];

  const isCheckout = type === "checkout";
  const labelSaidaChegada = isCheckout ? "Chegada" : "Saída";

  // Estados de Validação e Erros
  const [kmError, setKmError] = useState<string | null>(null);
  const [isValidatingKM, setIsValidatingKM] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    motivo?: string;
    fotos?: string;
  }>({});

  // Estados de feedback visual (verde/vermelho nos campos)
  const [fieldValidations, setFieldValidations] = useState<{
    motivoValid: boolean;
    kmValid: boolean;
    fotosValid: boolean;
    combustivelValid: boolean;
  }>({
    motivoValid: false,
    kmValid: false,
    fotosValid: false,
    combustivelValid: true,
  });

  // --- Efeitos e Lógica de Validação ---

  // Valida campos automaticamente quando os dados mudam
  useEffect(() => {
    const newValidations = { ...fieldValidations };

    if (!isCheckout) {
      newValidations.motivoValid = formData.motivo.trim().length > 0;
    }

    newValidations.fotosValid = formData.fotos.length > 0;
    newValidations.combustivelValid = formData.combustivel >= 0 && formData.combustivel <= 100;

    setFieldValidations(newValidations);
  }, [formData.motivo, formData.fotos, formData.combustivel, isCheckout]);

  // Atualiza um campo específico do formData
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Limpa erros específicos ao digitar
    if (field === 'motivo' && formErrors.motivo) {
      setFormErrors(prev => ({ ...prev, motivo: undefined }));
    }
    if (field === 'fotos' && formErrors.fotos) {
      setFormErrors(prev => ({ ...prev, fotos: undefined }));
    }
    
    if (field === 'km') {
      setKmError(null);
      setFieldValidations(prev => ({ ...prev, kmValid: false }));
    }
  };

  // Chama a API de validação de KM
  const validateKMField = async (kmValue: string) => {
    if (!kmValue.trim() || !onValidateKM) {
      setFieldValidations(prev => ({ ...prev, kmValid: false }));
      return false;
    }

    setIsValidatingKM(true);
    try {
      const isValid = await onValidateKM(kmValue);
      if (isValid) {
        setKmError(null);
        setFieldValidations(prev => ({ ...prev, kmValid: true }));
        return true;
      } else {
        setKmError(isCheckout 
          ? 'KM de chegada deve ser maior que a KM de saída' 
          : 'KM inválida. Deve atender aos critérios.');
        setFieldValidations(prev => ({ ...prev, kmValid: false }));
        return false;
      }
    } catch (error) {
      setKmError('Erro ao validar KM');
      setFieldValidations(prev => ({ ...prev, kmValid: false }));
      return false;
    } finally {
      setIsValidatingKM(false);
    }
  };

  // --- Handlers de Navegação ---

  const handleNext = () => {
    let hasErrors = false;
    const newErrors: typeof formErrors = {};

    if (currentStep === 1) {
      if (!formData.km.trim()) {
        setKmError('KM é obrigatória');
        hasErrors = true;
      }
      
      if (!isCheckout && !formData.motivo.trim()) {
        newErrors.motivo = 'Motivo da utilização é obrigatório';
        hasErrors = true;
      }
    }

    if (currentStep === 2 && formData.fotos.length === 0) {
      newErrors.fotos = 'É obrigatório anexar pelo menos 1 foto';
      hasErrors = true;
    }

    setFormErrors(newErrors);

    if (!hasErrors && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else if (hasErrors) {
      const errorMessage = Object.values(newErrors).find(msg => msg) || 
                          (kmError ? 'Por favor, corrija os erros acima' : undefined);
      if (errorMessage) {
        toast.error("Validação", {
          description: errorMessage,
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

<<<<<<< HEAD
  // Handler para upload de comprovante (Checkout)
=======
  const handleSubmit = () => {
    if (isCheckout) {
      const checkoutPayload: CheckOutPayload = {
        idFrota: idFrota,
        idFrotaHistorico: idFrotaHistorico || "",
        CombustivelChegada: formData.combustivel,
        KMChegada: formData.km,
        ObservacaoChegada: formData.observacoes,
        FlgAbastecimento: formData.teveAbastecimento,
        ValorAbastecimento: formData.valorAbastecimento,
        fileEnvio: formData.comprovanteAbastecimento,
        ObservacaoOcorrencia: formData.descricaoOcorrencia,
        FlgOcorrencia: formData.temOcorrencia,
        imagemOcorrencia: formData.desenhoAvaria,
        fileEnvioOcorrencia: formData.fotos,
      };
      onSubmit(checkoutPayload);
    } else {
      const checkinPayload: CheckInPayload = {
        idFrota: idFrota,
        Condutor: formData.condutor,
        Utilizacao: formData.motivo,
        CombustivelSaida: formData.combustivel,
        KmSaida: formData.km,
        ObservacaoSaida: formData.observacoes,
        ObservacaoCheckIn: formData.descricaoOcorrencia,
        FlgCheckIn: formData.temOcorrencia,
        imagemOcorrencia: formData.desenhoAvaria,
        fileEnvioOcorrencia: formData.fotos,
      };
      onSubmit(checkinPayload);
    }
  };

>>>>>>> f8e2b35b90a0373886293c9ca7880edc9178621a
  const handleComprovanteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateFormData("comprovanteAbastecimento", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handler de Envio Final ---

  const handleSubmit = async () => {
    const errors: typeof formErrors = {};
    let hasErrors = false;

    // Validação final obrigatória de todos os campos
    if (!formData.km.trim()) {
      setKmError('KM é obrigatória');
      hasErrors = true;
    } else if (onValidateKM) {
      const isValid = await validateKMField(formData.km);
      if (!isValid) {
        hasErrors = true;
      }
    }

    if (!isCheckout && !formData.motivo.trim()) {
      errors.motivo = 'Motivo da utilização é obrigatório';
      hasErrors = true;
    }

    if (formData.fotos.length === 0) {
      errors.fotos = 'É obrigatório anexar pelo menos 1 foto';
      hasErrors = true;
    }

    setFormErrors(errors);

    if (hasErrors) {
      const errorMessage = errors.motivo || errors.fotos || kmError;
      toast.error("Não é possível prosseguir", {
        description: errorMessage || "Por favor, corrija os erros no formulário.",
      });
      return;
    }

    // Limpa os dados salvos após o envio bem-sucedido
    localStorage.removeItem(storageKey);

    // Monta o Payload correto baseado no tipo de operação
    if (isCheckout) {
      const checkoutPayload: CheckOutPayload = {
        idFrota: idFrota,
        Condutor: formData.condutor,
        idFrotaHistorico: idFrotaHistorico || "",
        CombustivelChegada: formData.combustivel,
        KMChegada: formData.km,
        ObservacaoChegada: formData.observacoes,
        FlgAbastecimento: formData.teveAbastecimento,
        ValorAbastecimento: formData.valorAbastecimento,
        fileEnvio: formData.comprovanteAbastecimento,
        ObservacaoOcorrencia: formData.descricaoOcorrencia,
        FlgOcorrencia: formData.temOcorrencia,
        imagemOcorrencia: formData.desenhoAvaria,
        desenhoAvariaHistory: formData.desenhoAvariaHistory,
        fileEnvioOcorrencia: formData.fotos,
        chaveAPI: formData.chaveAPI,
      };
      onSubmit(checkoutPayload);
    } else {
      const checkinPayload: CheckInPayload = {
        idFrota: idFrota,
        Condutor: formData.condutor,
        Utilizacao: formData.motivo,
        CombustivelSaida: formData.combustivel,
        KmSaida: formData.km,
        ObservacaoSaida: formData.observacoes,
        ObservacaoCheckIn: formData.descricaoOcorrencia,
        FlgCheckIn: formData.temOcorrencia,
        imagemOcorrencia: formData.desenhoAvaria,
        desenhoAvariaHistory: formData.desenhoAvariaHistory,
        fileEnvioOcorrencia: formData.fotos,
        chaveAPI: formData.chaveAPI,
      };
      onSubmit(checkinPayload);
    }
  };

  // Limpa os dados salvos quando o formulário é cancelado
  const handleCancelWithCleanup = () => {
    localStorage.removeItem(storageKey);
    onCancel();
  };

  // --- Renderização Auxiliar ---

  // Exibe mensagens de sucesso/erro/ajuda nos campos
  const renderFieldFeedback = (fieldName: string, isValid: boolean, error?: string, validating?: boolean, helperText?: string) => {
    if (validating) {
      return <p className="text-xs text-gray-500 mt-1">Validando {fieldName}...</p>;
    }
    
    if (error) {
      return <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>;
    }
    
    if (isValid) {
      return <p className="text-xs text-green-600 mt-1">✓ Válido</p>;
    }
    
    if (helperText) {
      return <p className="text-[10px] text-muted-foreground mt-0.5">{helperText}</p>;
    }
    
    return null;
  };

  // --- Renderização dos Passos ---

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          // space-y-4 para mobile, sm:space-y-6 para desktop
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left mb-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Dados da {labelSaidaChegada}
              </h3>
            </div>

            <div className="space-y-4">
<<<<<<< HEAD
              {/* Campo Condutor (Read Only) */}
=======
              {!isCheckout && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Nome do Condutor
                  </label>
                  <input
                    type="text"
                    value={formData.condutor}
                    onChange={(e) => updateFormData("condutor", e.target.value)}
                    placeholder="Digite o nome do condutor..."
                    className="input-fleet"
                  />
                </div>
              )}

>>>>>>> f8e2b35b90a0373886293c9ca7880edc9178621a
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                  Condutor
                </label>
                {/* Estilo de input desabilitado, mas limpo */}
                <div className="w-full bg-slate-100 px-4 py-3 rounded-lg text-slate-700 font-medium border border-slate-200">
                  {formData.condutor}
                </div>
              </div>

              {/* Campo Motivo (Apenas Check-in) */}
              {!isCheckout && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                    Motivo da Utilização *
                  </label>
                  <textarea
                    value={formData.motivo}
                    onChange={(e) => updateFormData("motivo", e.target.value)}
                    placeholder="Descreva o motivo..."
                    // min-h-[80px] garante altura mínima confortável no celular
                    className={`textarea-fleet w-full min-h-[80px] ${formErrors.motivo ? 'border-red-500 ring-1 ring-red-500' : ''} ${fieldValidations.motivoValid && !formErrors.motivo ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                  />
                  {renderFieldFeedback("Motivo", fieldValidations.motivoValid, formErrors.motivo)}
                </div>
              )}

              {/* Campo KM */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                  KM de {labelSaidaChegada} *
                </label>
                <input
                  type="text"
                  inputMode="decimal" // Abre teclado numérico no mobile
                  value={formData.km}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = value.replace(/[^\d,.]/g, '');
                    updateFormData("km", numericValue);
                  }}
                  onBlur={async (e) => {
                    if (e.target.value.trim() && onValidateKM) {
                      await validateKMField(e.target.value);
                    }
                  }}
                  placeholder="Ex: 45.230"
                  className={`input-fleet w-full ${kmError ? 'border-red-500 ring-1 ring-red-500' : ''} ${fieldValidations.kmValid && !kmError ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                />
                {renderFieldFeedback("KM", fieldValidations.kmValid, kmError, isValidatingKM)}
              </div>

              {/* Seletor de Combustível */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-xs font-semibold text-foreground mb-3 text-center uppercase tracking-wide text-slate-500">
                  Nível de Combustível {isCheckout ? "Final" : "Inicial"} *
                </label>
                <FuelGauge
                  value={formData.combustivel}
                  onChange={(value) => updateFormData("combustivel", value)}
                />
                <div className="mt-2 text-center">
                  {/* Badge visual para mostrar a % */}
                  <span className="text-xs text-slate-600 font-medium bg-white px-2 py-1 rounded border border-slate-200 shadow-sm inline-block">
                    {formData.combustivel}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        // MENSAGEM DE ALERTA (Atenção)
        const alertaMensagem = isCheckout
          ? "Ao entregar o veículo, pedimos gentilmente que verifique seu estado e nos informe sobre qualquer ocorrência, defeito ou problema existente. Caso não haja nenhuma notificação e um dano seja identificado posteriormente, a responsabilidade será atribuída ao usuário."
          : "Ao receber o veículo, pedimos gentilmente que verifique seu estado e nos informe sobre qualquer ocorrência, defeito ou problema existente. Caso não haja nenhuma notificação inicial e um dano seja identificado posteriormente, a responsabilidade será atribuída ao usuário.";

        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left mb-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Condições do Veículo
              </h3>
            </div>

            {/* CAIXA DE ALERTA (NOVA) */}
            <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-900 font-medium leading-snug">
                {alertaMensagem}
              </p>
            </div>

            {/* Seção de Abastecimento (Apenas Checkout) */}
            {isCheckout && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={formData.teveAbastecimento}
                    onChange={(e) => updateFormData("teveAbastecimento", e.target.checked)}
                    className="checkbox-fleet w-5 h-5"
                  />
                  <span className="font-semibold text-foreground">Teve Abastecimento?</span>
                </label>

                {formData.teveAbastecimento && (
                  <div className="space-y-4">
                    <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                      Valor
                    </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <NumericFormat 
                          value={formData.valorAbastecimento}
                          onValueChange={(values) => {
                            const { formattedValue } = values;
                            updateFormData("valorAbastecimento", formattedValue);
                          }}
                          thousandSeparator="."
                          decimalSeparator=","
                          decimalScale={2}
                          fixedDecimalScale={true}
                          allowNegative={false}
                          placeholder="0,00"
                          className="input-fleet w-full pl-10"
                        />
                      </div>
                  </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                        Comprovante
                      </label>
                      {formData.comprovanteAbastecimento ? (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 mx-auto sm:mx-0">
                          <img src={formData.comprovanteAbastecimento} alt="Comprovante" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => updateFormData("comprovanteAbastecimento", "")} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition w-full justify-center text-sm text-slate-600">
                          <Upload className="w-4 h-4" /> Adicionar Foto
                          <input type="file" accept="image/*" onChange={handleComprovanteUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Seção de Ocorrência / Avaria */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.temOcorrencia}
                  onChange={(e) => updateFormData("temOcorrencia", e.target.checked)}
                  className="checkbox-fleet w-5 h-5"
                />
                <span className="font-semibold text-foreground">Há ocorrência / avaria?</span>
              </label>

              {formData.temOcorrencia && (
                <div className="space-y-4 mt-4">
                  {/* MUDANÇA CRÍTICA DE LAYOUT MOBILE: 
                       Removemos padding interno extra e aplicamos w-full para maximizar a área de desenho.
                       touch-none impede o scroll da página ao desenhar. */}
                  <div className="w-full rounded-lg overflow-hidden relative bg-white border border-slate-200 touch-none select-none" style={{ minHeight: '300px' }}>
                    <DrawingCanvas
                      imageSrc="/assets/img/Desenho-carro_Prancheta-1-1024x853.jpg"
                      onDrawingChange={(dataUrl) => updateFormData("desenhoAvaria", dataUrl)}
                      onDrawHistoryChange={(history) => updateFormData("desenhoAvariaHistory", history)}
                      initialDrawHistory={formData.desenhoAvariaHistory}
                      /* className="w-full h-full block" */
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricaoOcorrencia}
                      onChange={(e) => updateFormData("descricaoOcorrencia", e.target.value)}
                      placeholder="Descreva a ocorrência..."
                      className="textarea-fleet w-full min-h-[80px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Seção de Upload de Fotos */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="mb-3">
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                  Fotos do Veículo *
                </label>
                {renderFieldFeedback("Fotos", fieldValidations.fotosValid, formErrors.fotos)}
              </div>
              <PhotoUpload
                photos={formData.fotos}
                onPhotosChange={(photos) => updateFormData("fotos", photos)}
                label="Fotos do Veículo"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center sm:text-left mb-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Observações
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide text-slate-500">
                Observações Adicionais
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => updateFormData("observacoes", e.target.value)}
                placeholder="Observações adicionais..."
                className="textarea-fleet w-full min-h-[120px]"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center sm:text-left mb-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Confirmação
              </h3>
            </div>

<<<<<<< HEAD
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-3">
                {/* Item de Resumo Padrão */}
                <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                  <span className="text-sm text-slate-500">Condutor</span>
                  <span className="text-sm font-semibold text-slate-800">{formData.condutor} ✓</span>
=======
            <div className="card-elevated">
              <h4 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border">
                DADOS DA {labelSaidaChegada.toUpperCase()}
              </h4>

              <div className="space-y-1">
                {!isCheckout && (
                  <div className="summary-item">
                    <span className="summary-label">Condutor:</span>
                    <span className="summary-value">{formData.condutor || "—"}</span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">{isCheckout ? "Observação Chegada:" : "Motivo:"}</span>
                  <span className="summary-value">{formData.motivo || "—"}</span>
>>>>>>> f8e2b35b90a0373886293c9ca7880edc9178621a
                </div>
                
                {!isCheckout && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Motivo</span>
                    <span className="text-sm font-semibold text-slate-800">{formData.motivo}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">KM {labelSaidaChegada}</span>
                  <span className="text-sm font-semibold text-slate-800">{formData.km}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Combustível</span>
                  <span className="text-sm font-semibold text-slate-800">{formData.combustivel}%</span>
                </div>
                
                {isCheckout && (
                   <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="text-sm text-slate-500">Abastecimento</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {formData.teveAbastecimento ? `R$ ${formData.valorAbastecimento}` : "Não"}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-b border-slate-200">
                  <span className="text-sm text-slate-500">Fotos</span>
                  <span className="text-sm font-semibold text-slate-800">{formData.fotos.length}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-500">Ocorrência</span>
                  <span className="text-sm font-semibold text-slate-800">{formData.temOcorrencia ? "Sim" : "Não"}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --- Estrutura Principal do Render (JSX Otimizado) ---

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in-up">
      {/* Componente de Passos (Stepper) */}
      {/* Array de ícones para substituir números nos círculos */}
      <Stepper 
        currentStep={currentStep} 
        steps={[
          <Info className="w-4 h-4" />,          // Passo 1: Introdução
          <Car className="w-4 h-4" />,          // Passo 2: Saída/Chegada (Substituição do Tachometer)
          <Camera className="w-4 h-4" />,       // Passo 3: Condições
          <MessageSquare className="w-4 h-4" />, // Passo 4: Observações
          <CheckCircle className="w-4 h-4" />   // Passo 5: Finalizar
        ]} 
      />

      {/* 
         MUDANÇA CRÍTICA DE LAYOUT MOBILE:
         Mesclamos a div container geral e o cartão branco em um único elemento.
         
         - bg-white: Fundo branco do formulário.
         - rounded-xl: Bordas arredondadas modernas.
         - shadow-sm sm:shadow-lg: Sombra leve no mobile, forte no desktop.
         - p-3 sm:p-6: Padding de 12px no mobile (maximiza área de inputs) e 24px no desktop (confortável).
         - min-h-[400px]: Garante altura mínima para evitar pulos visuais.
      */}
      <div className="bg-white rounded-xl shadow-sm sm:shadow-lg p-3 sm:p-6 min-h-[400px]">
        {renderStep()}
      </div>

      {/* Botões de Navegação */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-0">
        {currentStep > 1 ? (
          <button type="button" onClick={handleBack} className="btn-fleet-secondary flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        ) : (
          <button type="button" onClick={handleCancelWithCleanup} className="btn-fleet-secondary flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3">
            <X className="w-4 h-4" /> Cancelar
          </button>
        )}

        {currentStep < 4 ? (
          <button 
            type="button" 
            onClick={handleNext} 
            className="btn-fleet-primary flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3"
          >
            Próximo <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isValidatingKM || !fieldValidations.kmValid || (!isCheckout && !fieldValidations.motivoValid) || !fieldValidations.fotosValid}
            className={`${type === "checkin" ? "btn-checkin" : "btn-checkout"} flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 ${(disabled || isValidatingKM || !fieldValidations.kmValid || (!isCheckout && !fieldValidations.motivoValid) || !fieldValidations.fotosValid) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isValidatingKM ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Validando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> CONFIRMAR
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckInOutForm;