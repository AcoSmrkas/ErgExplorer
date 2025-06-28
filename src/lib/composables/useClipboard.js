/**
 * Composable for clipboard operations with toast notifications
 * @returns {object} Clipboard functionality
 */
export function useClipboard() {
  async function copyToClipboard(
    text,
    successMessage = "Copied to clipboard!",
  ) {
    try {
      await navigator.clipboard.writeText(text);

      // Show toast notification
      showToast(successMessage);
      return true;
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      showToast("Failed to copy to clipboard", "error");
      return false;
    }
  }

  function showToast(message, type = "success") {
    // Try to find existing toast
    let toast = document.getElementById("liveToast");

    // If no toast exists, create one
    if (!toast) {
      toast = createToast();
    }

    // Update toast content
    const toastBody = toast.querySelector(".toast-body");
    if (toastBody) {
      toastBody.textContent = message;
    }

    // Update toast type
    const toastElement = toast.querySelector(".toast");
    if (toastElement) {
      toastElement.className = `toast ${type === "error" ? "bg-danger text-white" : "bg-success text-white"}`;
    }

    // Show toast using Bootstrap
    if (typeof bootstrap !== "undefined") {
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }
  }

  function createToast() {
    const toastHtml = `
			<div id="liveToast" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1060;">
				<div class="toast bg-success text-white" role="alert" aria-live="assertive" aria-atomic="true">
					<div class="toast-header bg-success text-white">
						<i class="fas fa-check-circle me-2"></i>
						<strong class="me-auto">Success</strong>
						<button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
					</div>
					<div class="toast-body">
						Copied to clipboard!
					</div>
				</div>
			</div>
		`;

    // Insert toast into document if it doesn't exist
    document.body.insertAdjacentHTML("beforeend", toastHtml);
    return document.getElementById("liveToast");
  }

  // Convenience functions for common copy operations
  function copyId(id, type = "ID") {
    return copyToClipboard(id, `${type} copied to clipboard!`);
  }

  function copyAddress(address) {
    return copyToClipboard(address, "Address copied to clipboard!");
  }

  function copyTxId(txId) {
    return copyToClipboard(txId, "Transaction ID copied to clipboard!");
  }

  function copyBlockId(blockId) {
    return copyToClipboard(blockId, "Block ID copied to clipboard!");
  }

  function copyTokenId(tokenId) {
    return copyToClipboard(tokenId, "Token ID copied to clipboard!");
  }

  return {
    copyToClipboard,
    copyId,
    copyAddress,
    copyTxId,
    copyBlockId,
    copyTokenId,
  };
}
