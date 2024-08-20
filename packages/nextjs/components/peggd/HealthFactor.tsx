import React from "react";

interface HealthFactorProps {
  initialAmountEth: number;
  newAmountEth: number;
  initialAmountFbt: number;
  newAmountFbt: number;
}

function calculateNewHealthFactor(
  _initialAmountEth: number,
  _newAmountEth: number,
  _initialAmountFbt: number,
  _newAmountFbt: number,
) {
  const healthFactor =
    Math.floor(
      (((_initialAmountEth + _newAmountEth * 1e18) * 5 * 2000) /
        ((_initialAmountFbt + _newAmountFbt * 1e15) * 10 * 0.94) /
        1000) *
        100,
    ) / 100;

  return healthFactor;
}

function getColorBasedOnValue(value: number): string {
  if (value > 2) {
    return "green";
  } else if (value >= 1.5) {
    return "orange";
  } else {
    return "red";
  }
}

export const HealthFactor: React.FC<HealthFactorProps> = ({
  initialAmountEth,
  newAmountEth,
  initialAmountFbt,
  newAmountFbt,
}) => {
  const healthFactor = calculateNewHealthFactor(initialAmountEth, newAmountEth, initialAmountFbt, newAmountFbt);

  const color = getColorBasedOnValue(healthFactor);

  return <div style={{ color }}>{healthFactor}</div>;
};
