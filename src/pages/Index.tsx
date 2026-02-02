import { useState, useEffect, useCallback, useRef } from "react";
import { Car, LogIn, LogOut, X, Loader2, RefreshCw, Clock, Calendar, ShieldAlert } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import VehicleCard from "@/components/fleet/VehicleCard";
import CheckInOutForm, { CheckInPayload, CheckOutPayload } from "@/components/fleet/CheckInOutForm";
import { toast } from "sonner";

type OperationType = "checkin" | "checkout" | null;

interface VehicleData {
  idFrota: string;
  idFrotaHistorico: string | null;
  placa: string;
  modelo: string;
  ano: number;
  cor: string;
  km: number;
  combustivel: number;
  responsavel: string;
  marca?: string;
  chassi?: string;
  renavam?: string;
  isAvailable: boolean;
}

// Função para decodificar base64 (incluindo URL-safe)
const decodeBase64 = (encoded: string): string => {
  try {
    return atob(encoded);
  } catch {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    return atob(padded);
  }
};

// Função para formatar data e hora
const formatDateTime = (date: Date): { date: string, time: string, full: string } => {
  const dateStr = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const fullStr = `${dateStr} - ${timeStr}`;
  
  return {
    date: dateStr,
    time: timeStr,
    full: fullStr
  };
};

// Função para limpar mensagem de erro do backend (remove \n\r e caracteres especiais)
const cleanErrorMessage = (message: string): string => {
  return message.replace(/\\n\\r/g, '\n').replace(/\\n/g, '\n').trim();
};

const Index = () => {
  // Capturar parâmetros da URL
  const [searchParams] = useSearchParams();
  const idFrota = searchParams.get('idFrota');
  const idEmpresaEncoded = searchParams.get('idEmpresa');
  
  // Chave API para autenticação
  const chaveAPI = "1408";
  
  // Estados do componente
  const [operation, setOperation] = useState<OperationType>(null);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string, time: string, full: string }>({
    date: '',
    time: '',
    full: ''
  });
  
  // Ref para controlar se há dados não salvos
  const hasUnsavedDataRef = useRef(false);

  // Timer para atualizar data/hora em tempo real
  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(formatDateTime(new Date()));
    };
    
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Função para mostrar alerta antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Se houver dados não salvos e não estiver no processo de submissão
      if (hasUnsavedDataRef.current && !isSubmitting) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Tem certeza que deseja sair?';
        return e.returnValue;
      }
    };

    // Adiciona o listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // Remove o listener quando o componente desmonta
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSubmitting]);

  // Atualiza o ref quando operation muda
  useEffect(() => {
    // Se houver uma operação em andamento, há dados não salvos
    hasUnsavedDataRef.current = operation !== null;
  }, [operation]);

  // Função para cancelar operação com limpeza de dados
  const handleCancel = () => {
    // Verifica se há dados não salvos
    if (hasUnsavedDataRef.current) {
      if (window.confirm('Você tem alterações não salvas. Deseja realmente cancelar?')) {
        setOperation(null);
        hasUnsavedDataRef.current = false;
      }
    } else {
      setOperation(null);
    }
  };

  // Função para começar uma operação
  const handleStartOperation = (type: OperationType) => {
    setOperation(type);
    hasUnsavedDataRef.current = true;
  };

  // NOVA FUNÇÃO: Verifica se o usuário está logado via API
  const checkUserLogin = async (): Promise<boolean> => {
    try {
      console.log('Verificando status de login...');
      const response = await fetch('/index.php/webhook/testa_login', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        console.warn('Erro ao verificar login, assumindo deslogado.');
        return false;
      }
      
      const text = await response.text();
      const status = parseInt(text.trim());
      console.log(`Status Login: ${status} (1=Logado, 0=Deslogado)`);
      
      return status === 1;
    } catch (err) {
      console.error('Erro na checagem de login:', err);
      return false;
    }
  };

  // Função auxiliar para converter base64 para File
  const base64ToFile = (base64: string, filename: string): File | null => {
    try {
      if (!base64 || base64.length < 100) return null;
      
      const arr = base64.split(',');
      if (arr.length < 2) return null;
      
      const mimeMatch = arr[0].match(/:(.*?);/);
      if (!mimeMatch) return null;
      
      const mime = mimeMatch[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      return new File([u8arr], filename, { type: mime });
    } catch (err) {
      console.error('Erro ao converter base64 para File:', err);
      return null;
    }
  };

  // Função para validar a KM com o backend
  const validateKM = useCallback(async (km: string): Promise<boolean> => {
    console.log(`=== VALIDANDO KM ===`);
    console.log(`KM recebida: ${km}`);
    console.log(`Tipo: ${validationResult?.flgAbreFecha ? 'CHECK-IN' : 'CHECK-OUT'}`);
    console.log(`ID Frota: ${idFrota}`);
    console.log(`ID Frota Histórico: ${validationResult?.idFrotaHistorico}`);
    console.log(`KM do veículo: ${vehicleData?.km}`);
    
    if (!km || !idFrota) {
      console.log('Retornando true (sem KM ou idFrota)');
      return true;
    }
    
    const isCheckIn = validationResult?.flgAbreFecha === true;
    
    if (isCheckIn) {
      console.log('Processando CHECK-IN');
      try {
        const formattedKM = km.replace(',', '.');
        const response = await fetch(`/index.php/frota/ultimo_km_api/${idFrota}/${formattedKM}`);
        const resultText = await response.text();
        const trimmedResult = resultText.trim();
        console.log(`Resposta API check-in: "${trimmedResult}"`);
        return trimmedResult === "1";
      } catch (error) {
        console.error('Erro ao validar KM (check-in):', error);
        return false;
      }
    } else {
      console.log('Processando CHECK-OUT');
      try {
        const formattedKM = km.replace(',', '.');
        const idFrotaHistorico = validationResult?.idFrotaHistorico;
        
        if (!idFrotaHistorico) {
          console.error('ID do histórico não encontrado para validação de KM de chegada');
          return false;
        }
        
        console.log(`Chamando API check-out: idFrotaHistorico=${idFrotaHistorico}, kmChegada=${formattedKM}`);
        
        const response = await fetch(`/index.php/frota/validar_km_chegada_api/${idFrotaHistorico}/${formattedKM}`);
        const resultText = await response.text();
        const trimmedResult = resultText.trim();
        
        console.log(`Resposta API check-out: "${trimmedResult}"`);
        
        return trimmedResult === "1";
      } catch (error) {
        console.error('Erro ao validar KM (check-out):', error);
        return false;
      }
    }
  }, [idFrota, validationResult, vehicleData?.km]);

  // Função para validar o QR Code usando o endpoint leitura_qrcode
  const validateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidationResult(null);
      setVehicleData(null);
      setOperation(null);
      hasUnsavedDataRef.current = false;
      
      if (!idFrota || !idEmpresaEncoded) {
        throw new Error("Parâmetros da URL incompletos. É necessário idFrota e idEmpresa.");
      }
      
      console.log('ID Frota:', idFrota);
      console.log('ID Empresa (codificado):', idEmpresaEncoded);
      console.log('Data/Hora da validação:', currentDateTime.full);
      
      // Chama a função leitura_qrcode do controller
      const validateUrl = `/index.php/frota/leitura_qrcode/${idFrota}/${idEmpresaEncoded}`;
      console.log('Validando QR Code:', validateUrl);
      
      const validateResponse = await fetch(validateUrl, {
        method: 'GET',
        credentials: 'include',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      // Verifica se houve erro de rede ou servidor
      if (!validateResponse.ok) {
        throw new Error(`Erro ${validateResponse.status}: ${validateResponse.statusText}`);
      }
      
      const responseText = await validateResponse.text();
      
      let validation;
      try {
        validation = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Resposta não é JSON válido:', responseText.substring(0, 500));
        
        // Tenta identificar se é erro de banco de dados
        if (responseText.includes('Database Error') || responseText.includes('Error Number')) {
          throw new Error('Erro de configuração do banco de dados. Tabela não encontrada.');
        }
        
        // Tenta extrair mensagem de erro do HTML
        const errorMatch = responseText.match(/<b>(.*?)<\/b>/) || 
                          responseText.match(/<p class="error">(.*?)<\/p>/);
        if (errorMatch) {
          throw new Error(`Erro do servidor: ${errorMatch[1]}`);
        } else {
          throw new Error('Resposta inválida do servidor. Verifique se o endpoint está correto.');
        }
      }
      
      console.log('Resultado da validação:', validation);
      
      setValidationResult(validation);
      
      // TRATAMENTO ESPECÍFICO PARA ERROS
      if (validation.Status === '0' || validation.Status === false) {
        // Caso 1: Empresa incorreta
        if (validation.mensagem && validation.mensagem.includes('Favor realizar login na empresa correta')) {
          const mensagemLimpa = cleanErrorMessage(validation.mensagem);
          setError(mensagemLimpa);
          toast.error("Empresa incorreta", {
            description: mensagemLimpa,
            duration: 10000,
          });
          setLoading(false);
          return;
        }
        
        // Caso 2: Histórico em aberto de outro usuário
        if (validation.mensagem && validation.mensagem.includes('Existe historico criado')) {
          const mensagemLimpa = cleanErrorMessage(validation.mensagem);
          setError(mensagemLimpa);
          toast.error("Veículo em uso", {
            description: mensagemLimpa,
            duration: 8000,
          });
          setLoading(false);
          return;
        }
        
        // Caso 3: Outros erros de validação
        if (validation.mensagem) {
          const mensagemLimpa = cleanErrorMessage(validation.mensagem);
          throw new Error(mensagemLimpa);
        } else {
          throw new Error("QR Code inválido");
        }
      }

      // Se a validação for bem-sucedida, busca os dados do veículo
      await fetchVehicleData(validation.flgAbreFecha, validation.idFrotaHistorico);
      
    } catch (err: any) {
      console.error("Erro na validação:", err);
      
      let errorMessage = err.message || "Erro ao validar QR Code";
      let toastDescription = errorMessage;
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        toastDescription = "Não foi possível conectar ao servidor.";
      } else if (errorMessage.includes('Erro de configuração do banco de dados')) {
        errorMessage = "Erro de configuração do sistema. Contate o administrador.";
        toastDescription = "Problema na base de dados.";
      } else if (errorMessage.includes('Erro 500')) {
        errorMessage = "Erro interno no servidor. Tente novamente mais tarde.";
        toastDescription = "Problema temporário no servidor.";
      }
      
      setError(errorMessage);
      toast.error("Erro ao validar QR Code", {
        description: toastDescription,
        duration: 8000,
      });
      setLoading(false);
    }
  };

  // Função para buscar dados do veículo
  const fetchVehicleData = async (flgAbreFecha: boolean, idFrotaHistorico: string | null = null) => {
    try {
      console.log('=== BUSCANDO DADOS DO VEÍCULO ===');
      console.log('flgAbreFecha:', flgAbreFecha);
      console.log('idFrotaHistorico:', idFrotaHistorico);
      
      let dadosVeiculo;
      let dadosHistorico = null;
      
      if (flgAbreFecha === false && idFrotaHistorico) {
        console.log('Buscando dados do histórico para check-out');
        const historicoUrl = `/index.php/frota/dados_frota_historico/${idFrotaHistorico}`;
        console.log('URL histórico:', historicoUrl);
        
        const historicoResponse = await fetch(historicoUrl);
        
        if (!historicoResponse.ok) {
          throw new Error(`Erro ${historicoResponse.status} ao buscar histórico`);
        }
        
        const historicoData = await historicoResponse.json();
        console.log('Dados do histórico:', historicoData);
        
        dadosVeiculo = historicoData.frota;
        dadosHistorico = historicoData.frotaHistorico;
      } else {
        console.log('Buscando dados básicos do veículo para check-in');
        const veiculoUrl = `/index.php/frota/dados_frota/${idFrota}`;
        console.log('URL veículo:', veiculoUrl);
        
        const veiculoResponse = await fetch(veiculoUrl);
        
        if (!veiculoResponse.ok) {
          throw new Error(`Erro ${veiculoResponse.status} ao buscar veículo`);
        }
        
        dadosVeiculo = await veiculoResponse.json();
        console.log('Dados do veículo:', dadosVeiculo);
      }
      
      const vehicle: VehicleData = {
        idFrota: dadosVeiculo.idFrota ? dadosVeiculo.idFrota.toString() : idFrota || '',
        idFrotaHistorico: dadosHistorico ? dadosHistorico.idFrotaHistorico.toString() : idFrotaHistorico,
        placa: dadosVeiculo.PlacaNumero || 'Não informada',
        modelo: dadosVeiculo.Modelo || 'Não informado',
        ano: parseInt(dadosVeiculo.AnoFabricacao) || 0,
        cor: dadosVeiculo.Cor || 'Não informada',
        km: dadosHistorico ? 
            parseInt(dadosHistorico.KMSaida) || 0 : 
            (parseInt(dadosVeiculo.KMAtual) || 
             parseInt(validationResult?.KMChegada) || 
             parseInt(dadosVeiculo.Km) || 
             0),
        combustivel: dadosHistorico ? 
            Math.round((dadosHistorico.CombustivelSaida || 0) * 100) : 
            100, 
        responsavel: dadosVeiculo.NomeResponsavel || 'Não definido',
        marca: dadosVeiculo.Marca,
        chassi: dadosVeiculo.ChassiNumero,
        renavam: dadosVeiculo.RenavamNumero,
        isAvailable: flgAbreFecha
      };
      
      console.log('Vehicle mapeado:', vehicle);
      setVehicleData(vehicle);
      
      // Define automaticamente a operação baseado na validação
      if (flgAbreFecha) {
        setOperation("checkin");
      } else {
        setOperation("checkout");
      }
      
    } catch (err: any) {
      console.error("Erro ao buscar dados do veículo:", err);
      
      let errorMessage = err.message || "Erro ao carregar dados do veículo";
      let toastDescription = errorMessage;
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = "Erro de conexão ao buscar dados do veículo.";
        toastDescription = "Verifique sua conexão com a internet.";
      } else if (errorMessage.includes('404')) {
        errorMessage = "Veículo não encontrado no sistema.";
        toastDescription = "Verifique o código do veículo.";
      }
      
      setError(errorMessage);
      toast.error("Erro ao carregar dados", {
        description: toastDescription,
        duration: 8000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Inicialização - executa quando o componente é montado
  useEffect(() => {
    const initializeApp = async () => {
      if (!idFrota || !idEmpresaEncoded) {
        setError("Parâmetros do QR Code não encontrados na URL.");
        setLoading(false);
        toast.error("Link inválido", {
          description: "O QR Code não contém todas as informações necessárias.",
        });
        return;
      }

      // 1. Verificar Login
      const isLoggedIn = await checkUserLogin();
      
      if (!isLoggedIn) {
        const loginError = "Sessão expirada ou usuário não autenticado.";
        setError(loginError);
        toast.error("Acesso negado", {
          description: loginError,
          duration: 5000,
        });
        setLoading(false);
        return;
      }

      // 2. Validar QR Code
      await validateQRCode();
    };

    initializeApp();
  }, [idFrota, idEmpresaEncoded]);

  // Função para enviar dados do formulário com validação de KM
  const handleSubmit = async (data: CheckInPayload | CheckOutPayload) => {
    try {
      setIsSubmitting(true);
      
      // Verifica se é check-in e se há KM para validar
      const isCheckIn = validationResult?.flgAbreFecha === true;
      
      if (isCheckIn) {
        const checkinData = data as CheckInPayload;
        
        // Valida a KM antes de prosseguir
        if (checkinData.KmSaida && checkinData.KmSaida.trim() !== '') {
          const isValid = await validateKM(checkinData.KmSaida);
          if (!isValid) {
            toast.error("Não é possível prosseguir", {
              description: "A KM informada é inválida em relação à última KM registrada.",
            });
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      console.log("=== DADOS PARA ENVIO ===");
      console.log(data);
      console.log('Tipo de operação:', isCheckIn ? 'CHECK-IN' : 'CHECK-OUT');
      
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');
      console.log('Data/Hora do envio:', formattedDate);
      console.log('Chave API:', chaveAPI);
      
      let endpoint = '';
      const formData = new FormData();
      
      formData.append('chaveAPI', chaveAPI);
      
      if (isCheckIn) {
        const checkinData = data as CheckInPayload;
        
        endpoint = `/index.php/frota/adiciona_historico/${checkinData.idFrota}`;
        
        console.log('=== ENVIANDO CHECK-IN ===');
        console.log('Endpoint:', endpoint);
        
        formData.append('idFrota', checkinData.idFrota);
        formData.append('Condutor', checkinData.Condutor);
        formData.append('Utilizacao', checkinData.Utilizacao || '');
        formData.append('KMSaida', checkinData.KmSaida || '0');
        formData.append('CombustivelSaida', checkinData.CombustivelSaida?.toString() || '0');
        formData.append('ObservacaoSaida', checkinData.ObservacaoSaida || '');
        formData.append('FlgOcorrencia', checkinData.FlgCheckIn ? '1' : '0');
        formData.append('ObservacaoOcorrencia', checkinData.ObservacaoCheckIn || '');
        formData.append('DataHoraOperacao', formattedDate);
        
        if (checkinData.imagemOcorrencia && checkinData.imagemOcorrencia.length > 0) {
          const file = base64ToFile(checkinData.imagemOcorrencia, 'ocorrencia.png');
          if (file) {
            formData.append('imagemOcorrencia', file);
          }
        }
        
        if (checkinData.fileEnvioOcorrencia && checkinData.fileEnvioOcorrencia.length > 0) {
          checkinData.fileEnvioOcorrencia.forEach((base64, index) => {
            if (base64 && base64.length > 0) {
              const file = base64ToFile(base64, `ocorrencia_${index}.png`);
              if (file) {
                formData.append(`fileEnvioOcorrencia[${index}]`, file);
              }
            }
          });
        }
        
      } else {
        const checkoutData = data as CheckOutPayload;
        endpoint = `/index.php/frota/fechar_frota_historico`;
        
        console.log('=== ENVIANDO CHECK-OUT ===');
        console.log('Endpoint:', endpoint);
        console.log('ID Frota Histórico:', validationResult?.idFrotaHistorico);
        
        formData.append('idFrota', checkoutData.idFrota);
        formData.append('Condutor', checkoutData.Condutor);
        formData.append('idFrotaHistorico', validationResult?.idFrotaHistorico || checkoutData.idFrotaHistorico);
        formData.append('CombustivelChegada', checkoutData.CombustivelChegada?.toString() || '0');
        formData.append('KMChegada', checkoutData.KMChegada || '0');
        formData.append('ObservacaoChegada', checkoutData.ObservacaoChegada || '');
        formData.append('FlgAbastecimento', checkoutData.FlgAbastecimento ? '1' : '0');
        formData.append('DataHoraOperacao', formattedDate);
        
        if (checkoutData.FlgAbastecimento) {
          formData.append('ValorAbastecimento', checkoutData.ValorAbastecimento || '0');
          
          if (checkoutData.fileEnvio && checkoutData.fileEnvio.length > 0) {
            const file = base64ToFile(checkoutData.fileEnvio, 'comprovante_abastecimento.jpg');
            if (file) {
              formData.append('fileEnvio', file);
            }
          }
        }
        
        formData.append('FlgOcorrencia', checkoutData.FlgOcorrencia ? '1' : '0');
        if (checkoutData.FlgOcorrencia) {
          formData.append('ObservacaoOcorrencia', checkoutData.ObservacaoOcorrencia || '');
          
          if (checkoutData.imagemOcorrencia && checkoutData.imagemOcorrencia.length > 0) {
            const file = base64ToFile(checkoutData.imagemOcorrencia, 'ocorrencia_checkout.jpg');
            if (file) {
              formData.append('imagemOcorrencia', file);
            }
          }
        }
        
        if (checkoutData.fileEnvioOcorrencia && checkoutData.fileEnvioOcorrencia.length > 0) {
          checkoutData.fileEnvioOcorrencia.forEach((base64, index) => {
            if (base64 && base64.length > 0) {
              const file = base64ToFile(base64, `foto_veiculo_checkout_${index}.jpg`);
              if (file) {
                formData.append(`fileEnvioOcorrencia[${index}]`, file);
              }
            }
          });
        }
      }
      
      console.log('Enviando para:', endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      console.log('Resposta da API:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('Resposta texto (primeiros 500 chars):', responseText.substring(0, 500));
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Resposta não é JSON válido:', responseText);
        
        if (responseText.includes('Database Error') || responseText.includes('Error Number')) {
          throw new Error('Erro de banco de dados durante a operação.');
        }
        
        const errorMatch = responseText.match(/<b>(.*?)<\/b>/) || 
                          responseText.match(/<p class="error">(.*?)<\/p>/);
        
        const errorMessage = errorMatch ? 
          `Erro do servidor: ${errorMatch[1]}` : 
          'Resposta inválida do servidor.';
        
        throw new Error(errorMessage);
      }
      
      console.log('Resposta JSON:', responseData);
      
      if (!response.ok || !responseData.Status) {
        throw new Error(responseData.mensagem || responseData.error || 
                       `Erro ${response.status}: ${response.statusText}`);
      }
      
      const successMessage = isCheckIn ? "Check-In realizado com sucesso!" : "Check-Out realizado com sucesso!";
      toast.success(successMessage, {
        description: `${responseData.mensagem || `Veículo ${vehicleData?.placa} processado com sucesso.`} (${currentDateTime.time})`,
      });
      
      // Recarrega os dados atualizados
      await validateQRCode();
      setOperation(null);
      hasUnsavedDataRef.current = false;
      
    } catch (error: any) {
      console.error("Erro ao realizar operação:", error);
      
      let errorMessage = error.message || "Erro ao realizar operação";
      let toastDescription = errorMessage;
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = "Erro de conexão ao enviar dados.";
        toastDescription = "Verifique sua conexão com a internet.";
      } else if (errorMessage.includes('Erro de banco de dados')) {
        errorMessage = "Erro de configuração do sistema.";
        toastDescription = "Contate o administrador do sistema.";
      }
      
      toast.error("Erro ao realizar operação", {
        description: toastDescription,
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estados de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <Car className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary/70" />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Validando QR Code e carregando dados...</p>
          <p className="text-sm text-gray-500 mt-2">
            ID Veículo: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{idFrota || 'N/A'}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ID Empresa (codificado): <span className="font-mono bg-gray-200 px-2 py-1 rounded">{idEmpresaEncoded || 'N/A'}</span>
          </p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error || !vehicleData) {
    const isLoginError = error?.includes('autenticado') || error?.includes('expirada');
    const isEmpresaError = error?.includes('Favor realizar login na empresa correta');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${isLoginError ? 'bg-red-100' : isEmpresaError ? 'bg-yellow-100' : 'bg-red-100'} flex items-center justify-center`}>
              {isLoginError ? (
                <ShieldAlert className="w-10 h-10 text-red-500" />
              ) : isEmpresaError ? (
                <span className="text-3xl">⚠️</span>
              ) : (
                <Car className="w-10 h-10 text-red-500" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {isLoginError ? 'Acesso Negado' : isEmpresaError ? 'Empresa incorreta' : 'Erro no processamento'}
            </h1>
            
            <p className="text-gray-600 mb-6 whitespace-pre-line">
              {error || "Dados do veículo não disponíveis"}
            </p>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                {currentDateTime.time}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {currentDateTime.date}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isLoginError ? (
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 justify-center font-medium w-full sm:w-auto"
                >
                  <ShieldAlert className="w-5 h-5" /> Fazer Login
                </button>
              ) : (
                <>
                  {!isEmpresaError && (
                    <button
                      onClick={validateQRCode}
                      className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 justify-center font-medium w-full sm:w-auto"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Tentar novamente
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium w-full sm:w-auto"
                  >
                    Voltar ao início
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary text-white py-6 px-4 shadow-md z-10 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">Gestão de Frota</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${validationResult?.flgAbreFecha ? 'bg-green-500/30 text-green-200' : 'bg-orange-500/30 text-orange-200'}`}>
                    {validationResult?.flgAbreFecha ? '✅ CHECK-IN' : '🔄 CHECK-OUT'}
                  </span>
                  <span className="text-white/70 text-xs truncate">
                    {vehicleData.placa} • {vehicleData.modelo}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs sm:text-sm">
                  {currentDateTime.date}
                </span>
              </div>
              <div className="h-3.5 w-px bg-white/30"></div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs sm:text-sm font-bold">
                  {currentDateTime.time}
                </span>
              </div>
              <button
                onClick={validateQRCode}
                disabled={isSubmitting}
                className="ml-2 text-white/80 hover:text-white p-1.5 rounded-md hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Atualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {operation === null ? (
          <>
            <VehicleCard 
              vehicle={{
                placa: vehicleData.placa,
                modelo: vehicleData.modelo,
                ano: vehicleData.ano,
                cor: vehicleData.cor,
                km: vehicleData.km,
                combustivel: vehicleData.combustivel
              }} 
              isAvailable={vehicleData.isAvailable} 
            />

            <div className="text-center space-y-4">
              {validationResult?.flgAbreFecha ? (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 text-lg">VEÍCULO DISPONÍVEL</h3>
                  <p className="text-green-700 text-sm">Pronto para iniciar novo check-in</p>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <h3 className="font-bold text-orange-800 text-lg">VEÍCULO EM USO</h3>
                  <p className="text-orange-700 text-sm">Aguardando check-out</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              {validationResult?.flgAbreFecha ? (
                <button
                  onClick={() => handleStartOperation("checkin")}
                  disabled={isSubmitting}
                  className="btn-checkin flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-5 text-lg rounded-xl font-bold text-white shadow-lg disabled:opacity-50 w-full sm:w-auto"
                >
                  <LogIn className="w-5 h-5 sm:w-6 sm:h-6" /> INICIAR CHECK-IN
                </button>
              ) : (
                <button
                  onClick={() => handleStartOperation("checkout")}
                  disabled={isSubmitting}
                  className="btn-checkout flex items-center justify-center gap-3 px-8 py-4 sm:px-10 sm:py-5 text-lg rounded-xl font-bold text-white shadow-lg disabled:opacity-50 w-full sm:w-auto"
                >
                  <LogOut className="w-5 h-5 sm:w-6 sm:h-6" /> REALIZAR CHECK-OUT
                </button>
              )}
              <button 
                onClick={handleCancel}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 w-full sm:w-auto"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" /> CANCELAR
              </button>
            </div>
          </>
        ) : (
          <CheckInOutForm
            type={operation}
            idFrota={vehicleData.idFrota}
            idFrotaHistorico={vehicleData.idFrotaHistorico || undefined}
            condutor={validationResult.Usuario}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            disabled={isSubmitting}
            onValidateKM={validateKM}
          />
        )}
      </main>

      <footer className="mt-auto py-6 px-4 border-t border-gray-200 bg-slate-50">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-gray-500 text-sm">
          © Inter Gestao Integrada 2014 - {new Date().getFullYear()}
        </p>
        
        {validationResult && (
          <p className="text-gray-400 text-xs mt-2">
             • Usuário: {validationResult.Usuario || 'N/A'} • 
            Empresa: {validationResult.NomeEmpresa || 'N/A'} • 
          </p>
        )}
        
        {isSubmitting && (
          <p className="text-blue-500 text-xs mt-2 flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Enviando dados, aguarde...
          </p>
        )}
      </div>
    </footer>
    </div>
  );
};

export default Index;