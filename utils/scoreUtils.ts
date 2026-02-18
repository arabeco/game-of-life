
export const getScoreGrade = (score: number) => {
    if (score >= 100) return { grade: 'S', color: 'text-cyan-400', phrase: "Você foi além do próprio plano. Isso é raro." };
    if (score >= 85) return { grade: 'A', color: 'text-green-400', phrase: "Execução sólida. O Soberano avança." };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-400', phrase: "Bom ciclo. Algumas brechas a selar." };
    if (score >= 55) return { grade: 'C', color: 'text-orange-400', phrase: "Metade do caminho. O que travou?" };
    if (score >= 40) return { grade: 'D', color: 'text-red-400', phrase: "Ciclo comprometido. Revise o plano." };
    return { grade: 'E', color: 'text-red-900', phrase: "O plano existiu. A execução, não." };
};
