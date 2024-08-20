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
        <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full max-w-screen-lg">
          <div className="box-border p-4 border-2"> 1. Box</div>
          <div className="box-border p-4 border-2"> 2. Box</div>
          <div className="box-border p-4 border-2"> 3. Box</div>
          <div className="box-border p-4 border-2"> 4. Box</div>
        </div>
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Manage your</span>
            <div className="flex flex-row">
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
          <canvas id="myChart" width="400" height="200"></canvas>
        </div>
        Collateraization Factor: 50% of ETH (still hardcoded)
        <div>Collateral Deposited: ETH {formatUnits(BigInt(collateralDeposited || 0), 18).slice(0, 6)}</div>
        <div>Token Minted: USD {formatUnits(BigInt(accountCollateralValue || 0), 18).slice(0, 6)}</div>
        <div>Token Minted: FBT {formatUnits(BigInt(fbtMinted || 0), 15).slice(0, 6)}</div>
        <div>Token Minted: USD {formatUnits(BigInt(accountDebtValue || 0), 15).slice(0, 6)}</div>
        <div>
          HealthFactor:
          <HealthFactor
            initialAmountEth={Number(collateralDeposited) || Number(0)}
            newAmountEth={0}
            initialAmountFbt={Number(fbtMinted)}
            newAmountFbt={0}
          />
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
        <div className="w-3/4 mb-3"></div>
        <div>1. Approve WETh and deposit as Collateral</div>
        <ERC20Input amount={amountWeth} setAmount={setAmountWeth} />
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
        <div>New Healthfactor:</div>
        <HealthFactor
          initialAmountEth={Number(collateralDeposited) || Number(0)}
          newAmountEth={Number(amountWeth)}
          initialAmountFbt={Number(fbtMinted)}
          newAmountFbt={0}
        />
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
          newAmountEth={Number(0)}
          initialAmountFbt={Number(fbtMinted)}
          newAmountFbt={Number(amountFBT)}
        />
      </div>
    </>
  );
};

export default Home;
