interface FuelGaugeProps {
  value: number;
  onChange: (value: number) => void;
}

const FuelGauge = ({ value, onChange }: FuelGaugeProps) => {
  const segments = 8;
  const filledSegments = Math.round((value / 100) * segments);

  const getSegmentClass = (index: number) => {
    if (index >= filledSegments) return "fuel-segment-inactive";
    
    const position = index / segments;
    if (position < 0.125) return "fuel-segment-empty";
    if (position < 0.375) return "fuel-segment-low";
    if (position < 0.625) return "fuel-segment-mid";
    if (position < 0.875) return "fuel-segment-high";
    return "fuel-segment-full";
  };

  const handleSegmentClick = (index: number) => {
    const newValue = Math.round(((index + 1) / segments) * 100);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold text-destructive mr-2">E</span>
        {Array.from({ length: segments }).map((_, index) => (
          <div
  key={index}
  className={`
    fuel-segment
    ${getSegmentClass(index)}
    border border-border
    shadow-sm
    cursor-pointer
    transition
    hover:scale-105
  `}
  onClick={() => handleSegmentClick(index)}
  title={`${Math.round(((index + 1) / segments) * 100)}%`}
/>
        ))}
        <span className="text-sm font-bold text-green-600 ml-2">F</span>
      </div>
      <div className="text-center">
        <span className="text-3xl font-bold text-foreground">{value}%</span>
        <p className="text-sm text-muted-foreground mt-1">Nível de Combustível</p>
      </div>
    </div>
  );
};

export default FuelGauge;
