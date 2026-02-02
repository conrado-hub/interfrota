import React from "react";
import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  // MUDANÇA: Agora aceita um array de ícones (ReactNodes) ao invés de strings
  steps: React.ReactNode[];
}

const Stepper = ({ currentStep, steps }: StepperProps) => {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-4">
      {steps.map((step, index) => (
        <div key={index} className="stepper-item flex-1">
          <div className="flex items-center">
            <div
              className={`stepper-circle flex items-center justify-center ${
                index < currentStep
                  ? "stepper-circle-completed"
                  : index === currentStep
                  ? "stepper-circle-active animate-pulse-glow"
                  : "stepper-circle-pending"
              }`}
            >
              {/* LÓGICA ATUALIZADA:
                   1. Se o passo for anterior ao atual (completado), mostra o ícone de Check.
                   2. Caso contrário, mostra o ícone correspondente do array 'steps'.
              */}
              {index < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step
              )}
            </div>
            {/* Linha de conexão (Não aparece no último item) */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                  index < currentStep ? "bg-green-500" : "bg-secondary"
                }`}
              />
            )}
          </div>
          
          {/* REMOVIDO: Como 'step' agora é um Ícone (Componente React) e não uma string de texto,
               renderizá-lo aqui como texto causaria erro ou "[object Object]".
               Se você precisar de labels personalizados, recomenda-se passar um objeto 
               no array ex: { label: "Texto", icon: <Icon /> } */}
        </div>
      ))}
    </div>
  );
};

export default Stepper;