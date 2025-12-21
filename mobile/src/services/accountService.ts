import apiService from "./apiService";

export async function deleteAccount(): Promise<void> {
  await apiService.delete("/account/delete");
}










