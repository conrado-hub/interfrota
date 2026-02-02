import { Car, Calendar, Gauge, Fuel } from "lucide-react";

interface VehicleInfo {
  placa: string;
  modelo: string;
  ano: number;
  cor: string;
  km: number;
  combustivel: number;
}

interface VehicleCardProps {
  vehicle: VehicleInfo;
  isAvailable: boolean;
}

const VehicleCard = ({ vehicle, isAvailable }: VehicleCardProps) => {
  return (
    <div className="card-elevated animate-fade-in-up">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{vehicle.placa}</h2>
            <p className="text-muted-foreground">{vehicle.modelo}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isAvailable ? 'bg-green-100' : 'bg-orange-100'}`}>
          <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-green-500" : "bg-orange-500"}`} />
          <span className={`text-sm font-medium ${isAvailable ? 'text-green-700' : 'text-orange-700'}`}>
            {isAvailable ? "Disponível" : "Em Uso"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Ano</p>
            <p className="font-semibold text-foreground">{vehicle.ano}</p>
          </div>
        </div>
        {/* <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: vehicle.cor.toLowerCase() }} />
          <div>
            <p className="text-xs text-muted-foreground">Cor</p>
            <p className="font-semibold text-foreground">{vehicle.cor}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
          <Gauge className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Km Atual</p>
            <p className="font-semibold text-foreground">{vehicle.km.toLocaleString()}</p>
          </div>
        </div> */}
        <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
          <Fuel className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Combustível</p>
            <p className="font-semibold text-foreground">{vehicle.combustivel}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;