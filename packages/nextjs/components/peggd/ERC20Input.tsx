interface ERC20InputProps {
  amount: string;
  setAmount: (amount: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export const ERC20Input: React.FC<ERC20InputProps> = ({ amount, setAmount, placeholder, disabled = false }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Only allow numbers (and empty value)
    if (/^\d*$/.test(newValue)) {
      setAmount(newValue); // Keep the value as string
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <input
        type="text"
        id="number-input"
        value={amount}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled} // Apply the disabled attribute if true
        className={`border-2 border-blue-500 rounded-md px-3 py-1 focus:outline-none focus:border-blue-600 w-40 ${
          disabled ? "bg-gray-200 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
};
