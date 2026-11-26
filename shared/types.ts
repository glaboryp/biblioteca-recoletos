export type Named = { id: number; name: string }
export type OpenLoan = { id: number; borrowerName: string; borrowedAt: string }
export type CatalogBook = {
  id: number
  title: string
  author: string | null
  copies: number
  location: Named
  categories: Named[]
  loans: OpenLoan[]
}
export type Catalog = { books: CatalogBook[]; locations: Named[]; categories: Named[] }
export type BookInput = {
  title: string
  author?: string | null
  locationId: number
  categoryIds?: number[]
  copies?: number
}
