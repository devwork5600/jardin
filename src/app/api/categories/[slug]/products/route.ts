import { NextResponse, type NextRequest } from "next/server";
import { getCategoryBySlug } from "@/lib/catalog";
import { getListingPage } from "@/lib/category-listing";
import { parseFilters, parsePage } from "@/lib/category-filters";

// Pages 2+ of a category listing, fetched by the client's useInfiniteQuery.
// Same query params as the page URL (?sub=&marque=&prix=&stock=&tri=) + ?page=.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/categories/[slug]/products">,
) {
  const { slug } = await ctx.params;
  const params = Object.fromEntries(request.nextUrl.searchParams);

  const category = await getCategoryBySlug(slug);
  if (!category) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }

  const { page } = await getListingPage(category, {
    sub: params.sub,
    filters: parseFilters(params),
    page: parsePage(params),
  });

  return NextResponse.json(page);
}
