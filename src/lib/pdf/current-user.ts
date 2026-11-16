// Nome do usuário logado, para constar no PDF/arquivo gerado
export function currentUserName(): string | undefined {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.name ?? undefined
  } catch {
    return undefined
  }
}
