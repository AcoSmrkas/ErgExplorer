import { goto } from "$app/navigation";

// Reusable pagination logic
export function createPaginationHandler(page, loadDataFn, defaultLimit = 20) {
  // Get pagination params from URL
  const limit = parseInt(
    page.url.searchParams.get("limit") || defaultLimit.toString(),
    10,
  );
  const offset = parseInt(page.url.searchParams.get("offset") || "0", 10);
  const currentPage = Math.floor(offset / limit) + 1;

  // Handle page change
  async function handlePageChange(event) {
    const newPage = event.detail.page;
    const newOffset = (newPage - 1) * limit;
    const url = new URL(page.url);

    // Update offset and limit in URL
    if (newOffset === 0) {
      url.searchParams.delete("offset");
    } else {
      url.searchParams.set("offset", newOffset.toString());
    }

    if (limit === defaultLimit) {
      url.searchParams.delete("limit");
    } else {
      url.searchParams.set("limit", limit.toString());
    }

    // Update URL without full page reload
    await goto(url.pathname + url.search, {
      replaceState: false,
      noScroll: false,
      keepFocus: false,
    });

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Generate info text for page header
  function getInfoText(data, totalItems, loading) {
    if (loading || !data.length) return "";
    const start = offset + 1;
    const end = Math.min(offset + limit, offset + data.length);
    return `Showing ${start} - ${end}${totalItems ? ` of ${totalItems}` : ""} items`;
  }

  return {
    limit,
    offset,
    currentPage,
    handlePageChange,
    getInfoText,
  };
}
