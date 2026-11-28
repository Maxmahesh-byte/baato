import { getSql } from "./db";
import { readStockMap, type StockMap } from "./inventory";

export async function publicStock(): Promise<StockMap> {
  return readStockMap(await getSql());
}
