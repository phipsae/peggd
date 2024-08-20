interface ERC20InputProps {
  amount: string;
  setAmount: (amount: string) => void;
}

export const ERC20Input: React.FC<ERC20InputProps> = ({ amount, setAmount }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Only allow numbers (and empty value)
    if (/^\d*$/.test(newValue)) {
      setAmount(newValue); // Keep the value as string
    }
  };

  return (
    <div>
      <label htmlFor="number-input">Enter a number: </label>
      <input type="text" id="number-input" value={amount} onChange={handleChange} placeholder="Enter a number" />
    </div>
  );
};
