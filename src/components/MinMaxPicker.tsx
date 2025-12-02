import React, { useState, useEffect } from "react";

interface PriceRangeInputsProps {
  initialMin: number;
  initialMax: number;
  maxAllowed?: number;
  onApplyFilter: (values: { min: number; max: number }) => void;
}

const PriceRangeInputs: React.FC<PriceRangeInputsProps> = ({
  initialMin = 10,
  initialMax = 50,
  maxAllowed = 1000,
  onApplyFilter
}) => {
  const [minValue, setMinValue] = useState(initialMin.toString());
  const [maxValue, setMaxValue] = useState(initialMax.toString());
  const [error, setError] = useState("");

  useEffect(() => {
    setMinValue(initialMin.toString());
    setMaxValue(initialMax.toString());
  }, [initialMin, initialMax]);

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (/^\d*$/.test(e.target.value)) {
        setter(e.target.value);
        setError("");
      }
  };

  const handleApplyFilter = () => {
    if (!minValue || !maxValue) return setError("Both minimum and maximum values are required.");

    const minNum = parseInt(minValue);
    const maxNum = parseInt(maxValue);

    if (isNaN(minNum) || isNaN(maxNum)) return setError("Please enter valid numbers.");
    if (minNum < 0) return setError("Minimum value must be at least 0.");
    if (maxNum > maxAllowed!) return setError(`Maximum value cannot exceed ${maxAllowed}.`);
    if (minNum > maxNum) return setError("Minimum value cannot be greater than maximum value.");

    onApplyFilter({ min: minNum, max: maxNum });
  };

  const resetValues = () => {
    setMinValue(initialMin.toString());
    setMaxValue(initialMax.toString());
    setError("");
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex gap-4">
          {[
            { label: "Min Price (€)", value: minValue, onChange: handleChange(setMinValue) },
            { label: "Max Price (€)", value: maxValue, onChange: handleChange(setMaxValue) }
          ].map(({ label, value, onChange }) => (
            <div key={label} className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={label.includes("Min") ? "Min" : "Max"}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#606c38]"
                required
              />
            </div>
          ))}
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={resetValues}
            type="button"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            Reset
          </button>
          <button
            onClick={handleApplyFilter}
            type="button"
            className="px-4 py-2 bg-[#606c38] text-white rounded hover:bg-[#4a5526]"
          >
            Show items
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceRangeInputs;
