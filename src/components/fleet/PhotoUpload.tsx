import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import imageCompression from 'browser-image-compression';
import { toast } from "sonner";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  label?: string;
  maxPhotos?: number;
}

const PhotoUpload = ({ photos, onPhotosChange, label = "Fotos do Veículo", maxPhotos = 20 }: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);

  // Função otimizada para comprimir imagem usando browser-image-compression
  const compressImage = async (file: File): Promise<string> => {
    try {
      const options = {
        maxSizeMB: 1, // Tamanho máximo em MB
        maxWidthOrHeight: 1024, // Resolução máxima
        useWebWorker: true, // Usa Web Worker para não bloquear a thread principal
        fileType: 'image/jpeg',
        initialQuality: 0.7,
      };

      const compressedFile = await imageCompression(file, options);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (err) => reject(err);
      });
    } catch (error) {
      console.error('Erro na compressão:', error);
      
      // Fallback para o método antigo se o novo falhar
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Erro no contexto do canvas"));
            
            // Reduz para 1024px mantendo proporção
            let width = img.width;
            let height = img.height;
            
            if (width > 1024) {
              height = (height * 1024) / width;
              width = 1024;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Comprime para JPEG com qualidade 0.6
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          
          img.onerror = reject;
        };
        
        reader.onerror = reject;
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Verifica se o número total de fotos não excede o máximo
    if (photos.length + files.length > maxPhotos) {
      toast.error("Limite de fotos excedido", {
        description: `Você pode adicionar no máximo ${maxPhotos} fotos.`,
      });
      e.target.value = '';
      return;
    }

    try {
      setProcessing(true);
      
      // Processa imagens sequencialmente para evitar sobrecarga de memória
      const newBase64Photos: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        setProcessingIndex(i + 1);
        const file = files[i];
        
        // Verifica o tamanho do arquivo antes de processar
        if (file.size > 20 * 1024 * 1024) { // 20MB
          toast.error("Arquivo muito grande", {
            description: `${file.name} é muito grande. Máximo: 20MB`,
          });
          continue;
        }
        
        const compressedBase64 = await compressImage(file);
        newBase64Photos.push(compressedBase64);
        
        // Pequena pausa para dar tempo ao GC
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Atualiza as fotos
      onPhotosChange([...photos, ...newBase64Photos]);

    } catch (error) {
      console.error("Erro ao processar imagens:", error);
      toast.error("Erro ao processar fotos", {
        description: "Tente fotos menores ou reinicie o aplicativo.",
      });
    } finally {
      setProcessing(false);
      setProcessingIndex(null);
      // Limpa o input
      if (e.target) e.target.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      
      {/* Área de Upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex flex-wrap gap-4 justify-center w-full">
            <button
              type="button"
              disabled={processing || photos.length >= maxPhotos}
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span>Tirar Foto</span>
            </button>
            <button
              type="button"
              disabled={processing || photos.length >= maxPhotos}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span>Galeria</span>
            </button>
          </div>
          
          {processing ? (
            <div className="text-center">
              <p className="text-xs text-gray-600">
                Processando {processingIndex} de {fileInputRef.current?.files?.length || cameraInputRef.current?.files?.length} fotos...
              </p>
              <p className="text-xs text-gray-500 mt-1">Aguarde, isso pode levar alguns segundos.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 text-center">
                Anexo máximo {maxPhotos} fotos
              </p>
              <p className="text-xs text-gray-500">
                {photos.length} / {maxPhotos} fotos
              </p>
            </>
          )}
        </div>
      </div>

      {/* Inputs Escondidos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={photos.length >= maxPhotos}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={photos.length >= maxPhotos}
      />

      {/* Preview das Fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
              <img 
                src={photo} 
                alt={`Foto ${index + 1}`} 
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remover foto"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;