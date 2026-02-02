import { useRef, useEffect, useState, useCallback } from "react";
import { Undo2, Trash2, Circle, Download, Save } from "lucide-react";

interface DrawingCanvasProps {
  imageSrc: string;
  onDrawingChange: (dataUrl: string) => void;
  onDrawHistoryChange?: (history: DrawPoint[][]) => void;
  initialDrawHistory?: DrawPoint[][];
  showExportButtons?: boolean;
}

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

const DrawingCanvas = ({ 
  imageSrc, 
  onDrawingChange, 
  onDrawHistoryChange,
  initialDrawHistory = [],
  showExportButtons = false 
}: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Use o initialDrawHistory como estado inicial
  const [drawHistory, setDrawHistory] = useState<DrawPoint[][]>(initialDrawHistory);
  const [currentPath, setCurrentPath] = useState<DrawPoint[]>([]);
  const [selectedColor, setSelectedColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(4);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Estado para armazenar a imagem e suas dimensões
  const [imageObject, setImageObject] = useState<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({
    naturalWidth: 0,
    naturalHeight: 0,
    aspectRatio: 1
  });
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1
  });

  const colors = [
    "#ef4444", "#f97316", "#eab308", "#22c55e"
  ];

  // Notificar o pai quando o histórico mudar
  useEffect(() => {
    if (onDrawHistoryChange) {
      onDrawHistoryChange(drawHistory);
    }
  }, [drawHistory, onDrawHistoryChange]);

  // Carregar a imagem
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObject(img);
      setImageDimensions({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calcular e configurar o tamanho do canvas baseado na imagem e container
  useEffect(() => {
    if (!imageLoaded || !imageObject || !containerRef.current) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container || !canvasRef.current) return;

      const containerWidth = container.clientWidth;
      const containerHeight = containerWidth / imageDimensions.aspectRatio;
      
      const canvas = canvasRef.current;
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      
      const scaleX = containerWidth / imageDimensions.naturalWidth;
      const scaleY = containerHeight / imageDimensions.naturalHeight;
      
      setCanvasDimensions({
        width: containerWidth,
        height: containerHeight,
        scaleX,
        scaleY
      });
      
      redrawEverything();
    };

    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [imageLoaded, imageObject, imageDimensions]);

  // Função para redesenhar tudo (imagem + marcações)
  const redrawEverything = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageObject) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageObject, 0, 0, canvas.width, canvas.height);
    
    drawHistory.forEach((path) => {
      if (path.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = path[0].color;
      ctx.lineWidth = path[0].size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const startX = path[0].x * canvas.width;
      const startY = path[0].y * canvas.height;
      ctx.moveTo(startX, startY);
      
      for (let i = 1; i < path.length; i++) {
        const x = path[i].x * canvas.width;
        const y = path[i].y * canvas.height;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    onDrawingChange(canvas.toDataURL("image/png", 1.0));
  }, [imageObject, drawHistory, onDrawingChange]);

  // Redesenhar quando o histórico muda
  useEffect(() => {
    if (imageLoaded) {
      redrawEverything();
    }
  }, [drawHistory, imageLoaded, redrawEverything]);

  // Calcular coordenadas proporcionais
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    return {
      x: Math.max(0, Math.min(x, 1)),
      y: Math.max(0, Math.min(y, 1))
    };
  };

  // Iniciar desenho
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentPath([{ x, y, color: selectedColor, size: brushSize }]);
  };

  // Continuar desenho
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCanvasCoordinates(e);
    const newPoint = { x, y, color: selectedColor, size: brushSize };
    
    const updatedPath = [...currentPath, newPoint];
    setCurrentPath(updatedPath);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || currentPath.length === 0) return;

    const lastPoint = currentPath[currentPath.length - 1];
    const lastX = lastPoint.x * canvas.width;
    const lastY = lastPoint.y * canvas.height;
    const currentX = x * canvas.width;
    const currentY = y * canvas.height;

    ctx.beginPath();
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  };

  // Parar desenho
  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 0) {
      const newHistory = [...drawHistory, currentPath];
      setDrawHistory(newHistory);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  // Desfazer última marcação
  const undo = () => {
    if (drawHistory.length === 0) return;
    const newHistory = drawHistory.slice(0, -1);
    setDrawHistory(newHistory);
  };

  // Limpar todas as marcações
  const clearAll = () => {
    setDrawHistory([]);
    setCurrentPath([]);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && imageObject) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageObject, 0, 0, canvas.width, canvas.height);
      onDrawingChange(canvas.toDataURL());
    }
  };

  // Exportar imagem com marcações em alta resolução
  const exportImage = () => {
    if (!imageObject) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;

    tempCanvas.width = imageDimensions.naturalWidth;
    tempCanvas.height = imageDimensions.naturalHeight;
    
    tempCtx.drawImage(imageObject, 0, 0);
    
    drawHistory.forEach((path) => {
      if (path.length < 2) return;
      
      tempCtx.beginPath();
      tempCtx.strokeStyle = path[0].color;
      tempCtx.lineWidth = path[0].size * 2;
      tempCtx.lineCap = "round";
      tempCtx.lineJoin = "round";

      const startX = path[0].x * tempCanvas.width;
      const startY = path[0].y * tempCanvas.height;
      tempCtx.moveTo(startX, startY);
      
      for (let i = 1; i < path.length; i++) {
        const x = path[i].x * tempCanvas.width;
        const y = path[i].y * tempCanvas.height;
        tempCtx.lineTo(x, y);
      }
      tempCtx.stroke();
    });

    const link = document.createElement('a');
    link.download = `imagem-marcada-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL("image/png", 1.0);
    link.click();
  };

  // Salvar estado atual
  const saveCurrentState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png", 1.0);
    onDrawingChange(dataUrl);
    
    const event = new CustomEvent('show-toast', {
      detail: { message: 'Marcações salvas com sucesso!', type: 'success' }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-xl shadow-lg">
      {/* Controles de desenho */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl">
        {/* <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Cor:</span>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                  selectedColor === color
                    ? "border-gray-800 scale-110 ring-2 ring-offset-2 ring-gray-300"
                    : "border-transparent"
                } ${color === "#ffffff" ? "border-gray-300" : ""}`}
                style={{ backgroundColor: color }}
                title={color === "#ffffff" ? "Branco" : ""}
              />
            ))}
          </div>
        </div> */}

        {/* <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Tamanho:</span>
          <div className="flex gap-2">
            {[2, 4, 8, 12].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setBrushSize(size)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                  brushSize === size 
                    ? "bg-blue-500 text-white shadow-md" 
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
                title={`Tamanho ${size}px`}
              >
                <Circle 
                  className="fill-current" 
                  style={{ 
                    width: Math.max(size, 6), 
                    height: Math.max(size, 6) 
                  }} 
                />
              </button>
            ))}
          </div>
        </div> */}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={drawHistory.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Desfazer última marcação"
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-sm font-medium">Desfazer</span>
          </button>
          
          <button
            type="button"
            onClick={clearAll}
            disabled={drawHistory.length === 0 && currentPath.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Limpar todas as marcações"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Limpar</span>
          </button>
        </div>
      </div>

      {/* Container do Canvas */}
      <div 
        ref={containerRef}
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden"
        style={{
          minHeight: '200px',
          aspectRatio: imageDimensions.aspectRatio ? `auto ${imageDimensions.aspectRatio}` : 'auto'
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            touchAction: 'none'
          }}
        />
        
        {/* Overlay de instruções */}
        {!drawHistory.length && !currentPath.length && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 text-white px-6 py-3 rounded-lg text-center backdrop-blur-sm">
              <p className="font-medium">Clique e arraste para marcar a imagem</p>
              <p className="text-sm text-gray-300 mt-1">As marcações serão salvas automaticamente</p>
            </div>
          </div>
        )}
        
        {/* Indicador de carregamento */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-gray-500">Carregando imagem...</div>
            </div>
          </div>
        )}
      </div>

      {/* Informações da imagem */}
      {/* {imageLoaded && (
        <div className="text-center text-sm text-gray-600">
          <p className="text-xs text-gray-500 mt-1">
            {drawHistory.length} marcações
          </p>
        </div>
      )} */}

      {/* Botões de exportação */}
      {showExportButtons && (
        <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={saveCurrentState}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
          >
            <Save className="w-5 h-5" />
            <span className="font-medium">Salvar Marcações</span>
          </button>
          
          <button
            type="button"
            onClick={exportImage}
            disabled={!imageLoaded}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Exportar Imagem</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DrawingCanvas;