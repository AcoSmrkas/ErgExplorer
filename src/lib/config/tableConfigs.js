import AddressLink from "../components/ui/AddressLink.svelte";
import {
  formatDateString,
  formatErgValue,
  formatFileSize,
  formatNumber,
  formatPriceUSD,
} from "../utils/formatting.js";
import { ergPrice } from "../stores/priceStore.js";
import { get } from "svelte/store";

// Latest Blocks table configurations
export function getLatestBlocksHeaders() {
  return [
    {
      label: "Height",
      field: "height",
      render: (value, row) =>
        `<a href="/blocks/${row.id}" data-block-id="${row.id}" class="height-link">${formatNumber(value)}</a>`,
    },
    {
      label: "Time",
      field: "timestamp",
      render: (value) => formatDateString(value),
    },
    {
      label: "TXs",
      field: "transactionsCount",
      render: (value) => formatNumber(value),
    },
    {
      label: "Mined by",
      field: "miner",
      component: AddressLink,
      componentProps: (row) => ({
        address: row.miner?.address || "",
        startChars: 9,
        endChars: 4,
        showCopy: false,
      }),
    },
    {
      label: "Reward",
      field: "minerReward",
      render: (value) =>
        `${formatErgValue(value)} <small class="text-muted">${formatPriceUSD(value, 9, get(ergPrice).value)}</small>`,
    },
    {
      label: "Size",
      field: "size",
      render: (value) => formatFileSize(value),
    },
  ];
}

// Note: Table styles are now centralized in /lib/styles/common-components.css
