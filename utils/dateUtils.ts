export const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

export const formatDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const getScoreGrade = (score: number) => {
    if (score >= 100) return { grade: 'S', color: 'text-cyan-400', phrase: "Você foi além do próprio plano. Isso é raro." };
    if (score >= 85) return { grade: 'A', color: 'text-green-400', phrase: "Execução sólida. O Soberano avança." };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-400', phrase: "Bom ciclo. Algumas brechas a selar." };
    if (score >= 55) return { grade: 'C', color: 'text-orange-400', phrase: "Metade do caminho. O que travou?" };
    if (score >= 40) return { grade: 'D', color: 'text-red-400', phrase: "Ciclo comprometido. Revise o plano." };
    return { grade: 'E', color: 'text-red-900', phrase: "O plano existiu. A execução, não." };
};
