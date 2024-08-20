"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import type { NextPage } from "next";
import { formatUnits, parseEther } from "viem";
import { erc20Abi } from "viem";
import { useWriteContract } from "wagmi";
import { useAccount } from "wagmi";
import { ERC20Input } from "~~/components/peggd/ERC20Input";
import { HealthFactor } from "~~/components/peggd/HealthFactor";
// import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Balance } from "~~/components/scaffold-eth";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";

Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend, Title, LineController);

const stockData = {
  labels: [
    "August '23",
    "September '23",
    "October '23",
    "November '23",
    "December '23",
    "January '24",
    "February '24",
    "March '24",
    "April '24",
    "May '24",
    "June '24",
    "July '24",
    "August '24",
  ],
  datasets: [
    {
      label: "Market Value",
      data: [833, 833, 896, 896, 882, 879, 879, 873, 873, 873, 899, 939, 939], // Example stock values
      borderColor: "rgba(75, 192, 192, 1)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      fill: false,
    },
  ],
};

function calculateNewHealthFactor(
  _initialAmountEth: number,
  _newAmountEth: number,
  _initialAmountFbt: number,
  _newAmountFbt: number,
) {
  console.log(_initialAmountEth, _newAmountEth, _initialAmountFbt, _newAmountFbt);
  const healthFactor =
    Math.floor(
      (((_initialAmountEth + _newAmountEth * 1e18) * 5 * 2000) /
        ((_initialAmountFbt + _newAmountFbt * 1e15) * 10 * 0.94) /
        1000) *
        100,
    ) / 100;

  return healthFactor;
}

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { writeContract } = useWriteContract();
  const [amountWeth, setAmountWeth] = useState("");
  const [amountFBT, setAmountFBT] = useState("");
  const chartRef = useRef<Chart | null>(null); // Use ref to store chart instance
  useEffect(() => {
    const ctx = document.getElementById("myChart") as HTMLCanvasElement | null;

    if (ctx) {
      // Destroy existing chart instance if it exists
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      // Create new chart instance and store it in ref
      chartRef.current = new Chart(ctx.getContext("2d")!, {
        type: "line",
        data: stockData,
        options: {
          responsive: true,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: "",
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: "Market Value in m$",
              },
            },
          },
          plugins: {
            legend: {
              display: false, // Set this to false to remove the legend
            },
          },
        },
      });
    }

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const { writeContractAsync: writeYourContractAsyncEngine } = useScaffoldWriteContract("AnchrEngine");

  const { data: collateralAddress } = useScaffoldReadContract({
    contractName: "AnchrEngine",
    functionName: "s_collateralTokens",
    args: [BigInt(0)],
  });

  const { data: collateralDeposited } = useScaffoldReadContract({
    contractName: "AnchrEngine",
    functionName: "s_collateralDeposited",
    args: [connectedAddress, collateralAddress],
  });

  const { data: fbtMinted } = useScaffoldReadContract({
    contractName: "AnchrEngine",
    functionName: "s_ascMinted",
    args: [connectedAddress],
  });

  const { data: healthFactor } = useScaffoldReadContract({
    contractName: "AnchrEngine",
    functionName: "_healthFactor",
    args: [connectedAddress],
  });

  const { data: accountDebtValue } = useScaffoldReadContract({
    contractName: "AnchrEngine",
    functionName: "getAccountDebtValue",
    args: [connectedAddress],
  });

  const { data: accountCollateralValue } = useScaffoldReadContract({
    contractName: "AnchrEngine",
    functionName: "getAccountCollateralValue",
    args: [connectedAddress],
  });
  const { data: anchrEngine } = useScaffoldContract({
    contractName: "AnchrEngine",
  });

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Manage your</span>
            <div className="flex flex-row mb-10">
              <Image
                src="/Fc_barcelona.svg.png"
                alt="fc barcelona logo"
                className="cursor-pointer w-30 h-30 mr-2"
                width={40}
                height={30}
              />
              <span className="block text-4xl font-bold"> FC Barcelona Token</span>
            </div>
          </h1>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full max-w-screen-lg">
          <div className="box-border p-4 border-2">
            <div className="flex flex-row justify-center mb-5">
              <Image
                src="/Fc_barcelona.svg.png"
                alt="fc barcelona logo"
                className="cursor-pointer w-30 h-30 mr-2"
                width={30}
                height={20}
              />
              <span className="block text-1xl font-bold"> FC Barcelona market value trend (last year)</span>
            </div>

            <canvas id="myChart" width="400" height="200"></canvas>
          </div>
          <div className="box-border p-4 border-2 flex flex-col justify-between h-full items-center">
            <div className="flex flex-col justify-center flex-grow">
              <div className="mb-4">
                <span className="block text-1xl font-bold mb-5"> ⚙️ Token Metrics</span>
              </div>
              <div className="mb-3">💵 Token price FBT* : $0.94</div>
              <div className="mb-3">∑ Total minted: {Number(fbtMinted) / 1e15 + 100000}</div>
              <div className="mb-3">💰 Total value FBT: {Math.floor((Number(fbtMinted) / 1e15 + 100000) * 0.94)} </div>
              <div className="mb-3">
                📈 Increase: <span style={{ color: "green" }}>13%</span> (last year)
              </div>
              <div>
                📈 Increase: <span style={{ color: "green" }}>8%</span> (last 3 months)
              </div>
            </div>
            <div className="mt-auto pt-5 text-sm">
              * FBT price is the market value of the whole Barcelone team from markettransfer.com diveded by one billion
            </div>
          </div>

          <div className="box-border p-4 border-2 flex flex-col justify-between h-full items-center">
            <div>
              <div className="mb-4">
                <span className="block text-1xl font-bold mb-5"> 📊 Statistics Overview</span>
              </div>
              <div className="mb-3">⚖️ ETH Collaterization Factor: 50% </div>
              <div className="mb-3">🛡️ Overcollatization rate: 200% </div>
              <div className="mb-3">
                📥 Collateral Deposited: ETH {formatUnits(BigInt(collateralDeposited || 0), 18).slice(0, 6)}
              </div>
              <div className="mb-3">
                💵 Total Value Collateral {formatUnits(BigInt(accountCollateralValue || 0), 18).slice(0, 6)}$
              </div>
              <div className="mb-3">🏭 Token Minted: FBT {formatUnits(BigInt(fbtMinted || 0), 15).slice(0, 6)}</div>
              <div className="mb-3">
                💵 Token Minted Value: {formatUnits(BigInt(accountDebtValue || 0), 15).slice(0, 6)}$
              </div>
              <div className="flex flex-row">
                <div>🏥 HealthFactor: </div>
                <HealthFactor
                  initialAmountEth={Number(collateralDeposited) || Number(0)}
                  newAmountEth={0}
                  initialAmountFbt={Number(fbtMinted)}
                  newAmountFbt={0}
                />
              </div>
            </div>
          </div>
          <div className="box-border p-4 border-2">
            <div>
              <div className="mb-4">
                <span className="block text-1xl font-bold mb-5"> 🧰 Manage token</span>
              </div>
            </div>
            <div>1. Approve WETh and deposit as Collateral</div>
            <ERC20Input amount={amountWeth} setAmount={setAmountWeth} />
            {anchrEngine && (
              <button
                className="btn btn-primary"
                onClick={() =>
                  writeContract({
                    abi: erc20Abi,
                    address: collateralAddress || "",
                    functionName: "approve",
                    args: [anchrEngine.address, parseEther(amountWeth)],
                  })
                }
              >
                Approve
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await writeYourContractAsyncEngine({
                    functionName: "depositCollateral",
                    args: [collateralAddress, parseEther(amountWeth)],
                  });
                } catch (e) {
                  console.error("Error setting greeting:", e);
                }
              }}
            >
              Deposit WETH
            </button>
            <div>3. Mint FBT</div>
            <ERC20Input amount={amountFBT} setAmount={setAmountFBT} />
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await writeYourContractAsyncEngine({
                    functionName: "mintAsc",
                    args: [parseEther(String(Number(amountFBT) / 1000))],
                  });
                } catch (e) {
                  console.error("Error setting greeting:", e);
                }
              }}
            >
              Mint FBT
            </button>
            New Healthfactor:
            <HealthFactor
              initialAmountEth={Number(collateralDeposited) || Number(0)}
              newAmountEth={Number(amountWeth)}
              initialAmountFbt={Number(fbtMinted)}
              newAmountFbt={Number(amountFBT)}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-error"
          onClick={() => {
            console.log(
              calculateNewHealthFactor(
                Number(collateralDeposited) || Number(0),
                Number(amountWeth),
                Number(fbtMinted),
                Number(amountFBT),
              ),
            );
          }}
        >
          Click Me
        </button>
      </div>
    </>
  );
};

export default Home;
