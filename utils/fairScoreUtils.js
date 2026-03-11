const MINUTES_PER_UNIT = 30;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const round2 = (value) => Math.round(value * 100) / 100;

const median = (values) => {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[middle];
    return (sorted[middle - 1] + sorted[middle]) / 2;
};

const getDurationMinutes = (task, actionById) => {
    if (Number.isFinite(task?.durationMinutes) && task.durationMinutes > 0) return task.durationMinutes;
    if (Number.isFinite(task?.duration) && task.duration > 0) return task.duration;
    const actionDuration = actionById?.get?.(task?.actionId)?.duration;
    if (Number.isFinite(actionDuration) && actionDuration > 0) return actionDuration;
    return MINUTES_PER_UNIT;
};

export const minutesToEffortUnits = (minutes) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return 0.5;
    return Math.max(0.5, minutes / MINUTES_PER_UNIT);
};

const shouldIgnoreTaskForFairScore = (task, actionById) => {
    const actionType = task?.actionType || actionById?.get?.(task?.actionId)?.actionType;
    return actionType === 'Livre';
};

const toTaskRecord = (task, actionById, arenaById) => {
    const action = actionById?.get?.(task?.actionId);
    const arenaId = task?.arenaId || action?.arenaId || 'unknown';
    const arenaName = task?.arenaName || arenaById?.get?.(arenaId)?.name || 'Sem arena';
    const durationMinutes = getDurationMinutes(task, actionById);
    const effortUnits = Number.isFinite(task?.effortUnits) && task.effortUnits > 0
        ? task.effortUnits
        : minutesToEffortUnits(durationMinutes);

    return {
        taskId: task?.taskId || task?.id || `${arenaId}-${task?.actionId || 'action'}-${task?.date || 'date'}-${task?.startTime ?? -1}`,
        actionId: task?.actionId,
        actionType: task?.actionType || action?.actionType || 'Compromisso',
        arenaId,
        arenaName,
        date: task?.date,
        completed: !!task?.completed,
        durationMinutes,
        effortUnits,
    };
};

export const buildAtlasTaskRecords = (weeklyAtlas = []) => {
    const seenTaskIds = new Set();
    const records = [];

    weeklyAtlas.forEach((week) => {
        (week?.days || []).forEach((day) => {
            [...(day?.scheduledItems || []), ...(day?.unscheduledItems || [])].forEach((item) => {
                const taskId = item?.taskId || `${day?.date || 'day'}-${item?.actionId || 'action'}-${item?.startTime ?? -1}`;
                if (seenTaskIds.has(taskId)) return;
                seenTaskIds.add(taskId);
                records.push({
                    ...item,
                    id: taskId,
                    taskId,
                    date: day?.date,
                    completed: !!item?.completed,
                });
            });
        });
    });

    return records;
};

export const buildMetaSealStats = (taskRecords = [], actionById, arenaById) => {
    const buckets = new Map();

    taskRecords.forEach((task) => {
        if (shouldIgnoreTaskForFairScore(task, actionById)) return;
        const record = toTaskRecord(task, actionById, arenaById);
        const existing = buckets.get(record.arenaId) || {
            arenaId: record.arenaId,
            arenaName: record.arenaName,
            plannedCount: 0,
            completedCount: 0,
            plannedUnits: 0,
            completedUnits: 0,
        };

        existing.plannedCount += 1;
        existing.plannedUnits += record.effortUnits;
        if (record.completed) {
            existing.completedCount += 1;
            existing.completedUnits += record.effortUnits;
        }

        buckets.set(record.arenaId, existing);
    });

    const arenas = [...buckets.values()].sort((left, right) => {
        return (right.completedUnits - left.completedUnits)
            || (right.plannedUnits - left.plannedUnits)
            || left.arenaName.localeCompare(right.arenaName);
    });

    return {
        arenas,
        plannedMetas: arenas.filter((arena) => arena.plannedCount > 0).length,
        sealedMetas: arenas.filter((arena) => arena.plannedCount > 0 && arena.completedCount >= arena.plannedCount).length,
    };
};

const getRealismPoints = (planLoadRatio) => {
    if (planLoadRatio < 0.25) return 6;
    if (planLoadRatio < 0.45) return 8;
    if (planLoadRatio <= 1.15) return 10;
    if (planLoadRatio <= 1.35) return 6;
    if (planLoadRatio <= 1.6) return 3;
    return 0;
};

const getAscensionPoints = (selfGrowthRate) => {
    if (selfGrowthRate >= 1.15) return 5;
    if (selfGrowthRate >= 0.9) return 4;
    if (selfGrowthRate >= 0.75) return 3;
    if (selfGrowthRate >= 0.5) return 1;
    return 0;
};

const getBaselineCandidates = (previousReports = []) => {
    return previousReports
        .map((report) => report?.metrics?.fairness)
        .filter((fairness) => (
            fairness
            && fairness.measurementStatus === 'scored'
            && Number.isFinite(fairness.honoredLoadUnits)
            && Number.isFinite(fairness.activeDays)
        ))
        .slice(-3);
};

const buildEmptyFairness = ({
    legacyPerformanceScore = 0,
    historyConfidence = 'fallback',
    measurementStatus = 'low_signal',
    activeDays = 0,
} = {}) => ({
    planLoadUnits: 0,
    honoredLoadUnits: 0,
    planHonorRate: 0,
    plannedMetas: 0,
    sealedMetas: 0,
    metaSealRate: 0,
    baselineLoadUnits: 0,
    baselineActiveDays: 0,
    activeDays,
    personalCadenceRate: 0,
    planLoadRatio: 0,
    planRealismPts: 0,
    selfGrowthRate: 0,
    ascensionPts: 0,
    frictionRate: 1,
    focusRatio: 0,
    measurementStatus,
    historyConfidence,
    scoreBreakdown: {
        honorPts: 0,
        metaPts: 0,
        cadencePts: 0,
        realismPts: 0,
        ascensionPts: 0,
    },
    legacyPerformanceScore,
    grade: null,
});

export const buildFairScoreFromTasks = ({
    tasks = [],
    actions = [],
    arenas = [],
    previousReports = [],
    durationDays = 0,
    legacyPerformanceScore = 0,
} = {}) => {
    const actionById = new Map((actions || []).map((action) => [action.id, action]));
    const arenaById = new Map((arenas || []).map((arena) => [arena.id, arena]));
    const relevantTasks = (tasks || [])
        .filter((task) => !!task)
        .filter((task) => !shouldIgnoreTaskForFairScore(task, actionById))
        .map((task) => toTaskRecord(task, actionById, arenaById));

    const plannedTaskCount = relevantTasks.length;
    const completedTasks = relevantTasks.filter((task) => task.completed);
    const activeDays = new Set(completedTasks.map((task) => task.date).filter(Boolean)).size;
    const planLoadUnits = round2(relevantTasks.reduce((sum, task) => sum + task.effortUnits, 0));
    const honoredLoadUnits = round2(completedTasks.reduce((sum, task) => sum + task.effortUnits, 0));
    const { arenas: metaArenas, plannedMetas, sealedMetas } = buildMetaSealStats(relevantTasks, actionById, arenaById);
    const dominantArena = metaArenas[0] || null;
    const focusRatio = honoredLoadUnits > 0 && dominantArena
        ? round2(clamp(dominantArena.completedUnits / honoredLoadUnits, 0, 1))
        : 0;

    const baselineCandidates = getBaselineCandidates(previousReports);
    const baselineLoadUnits = baselineCandidates.length >= 2
        ? round2(median(baselineCandidates.map((entry) => entry.honoredLoadUnits)))
        : Math.max(round2(planLoadUnits), 2);
    const seededActiveDays = activeDays || Math.min(Math.max(durationDays, 1), 4);
    const baselineActiveDays = baselineCandidates.length >= 2
        ? Math.max(1, Math.round(median(baselineCandidates.map((entry) => entry.activeDays))))
        : clamp(seededActiveDays || 3, 3, 10);
    const historyConfidence = baselineCandidates.length >= 2 ? 'stable' : 'seeded';

    const planHonorRate = planLoadUnits > 0 ? clamp(honoredLoadUnits / planLoadUnits, 0, 1) : 0;
    const metaSealRate = plannedMetas > 0 ? clamp(sealedMetas / plannedMetas, 0, 1) : 0;
    const personalCadenceRate = baselineActiveDays > 0 ? clamp(activeDays / baselineActiveDays, 0, 1) : 0;
    const planLoadRatio = baselineLoadUnits > 0 ? round2(planLoadUnits / baselineLoadUnits) : 0;
    const selfGrowthRate = baselineLoadUnits > 0 ? round2(honoredLoadUnits / baselineLoadUnits) : 0;

    const honorPts = Math.round(clamp(planHonorRate, 0, 1) * 40);
    const metaPts = Math.round(clamp(metaSealRate, 0, 1) * 30);
    const cadencePts = Math.round(clamp(personalCadenceRate, 0, 1) * 15);
    const realismPts = getRealismPoints(planLoadRatio);
    const ascensionPts = getAscensionPoints(selfGrowthRate);
    const fairScore = honorPts + metaPts + cadencePts + realismPts + ascensionPts;
    const measurementStatus = planLoadUnits < 2 || plannedMetas === 0 || (plannedTaskCount < 2 && planLoadUnits < 4)
        ? 'low_signal'
        : 'scored';
    const canBeS = (
        measurementStatus === 'scored'
        && historyConfidence === 'stable'
        && honoredLoadUnits >= 8
        && metaPts >= 15
        && planLoadRatio >= 0.55
    );

    let grade = 'E';
    if (fairScore >= 92 && canBeS) grade = 'S';
    else if (fairScore >= 84) grade = 'A';
    else if (fairScore >= 70) grade = 'B';
    else if (fairScore >= 55) grade = 'C';
    else if (fairScore >= 40) grade = 'D';

    return {
        fairScore,
        grade,
        plannedTaskCount,
        activeDays,
        metaArenas,
        dominantArenaId: dominantArena?.arenaId,
        dominantArenaName: dominantArena?.arenaName || 'Sem arena',
        fairness: {
            planLoadUnits,
            honoredLoadUnits,
            planHonorRate: round2(planHonorRate),
            plannedMetas,
            sealedMetas,
            metaSealRate: round2(metaSealRate),
            baselineLoadUnits,
            baselineActiveDays,
            activeDays,
            personalCadenceRate: round2(personalCadenceRate),
            planLoadRatio,
            planRealismPts: realismPts,
            selfGrowthRate,
            ascensionPts,
            frictionRate: round2(Math.max(0, 1 - planHonorRate)),
            focusRatio,
            measurementStatus,
            historyConfidence,
            scoreBreakdown: {
                honorPts,
                metaPts,
                cadencePts,
                realismPts,
                ascensionPts,
            },
            legacyPerformanceScore,
            grade,
        },
    };
};

export const applyFairScoreToReport = (report, previousReports = []) => {
    const legacyPerformanceScore = report?.metrics?.fairness?.legacyPerformanceScore ?? report?.performanceScore ?? 0;
    const weeklyAtlas = report?.metrics?.weeklyAtlas || [];
    const atlasTasks = buildAtlasTaskRecords(weeklyAtlas);
    const durationDays = Math.max(1, Math.round((new Date(report.endDate).getTime() - new Date(report.startDate).getTime()) / 86400000) + 1);

    if (atlasTasks.length === 0) {
        const fairness = {
            ...buildEmptyFairness({
                legacyPerformanceScore,
                historyConfidence: 'fallback',
                measurementStatus: 'low_signal',
                activeDays: report?.metrics?.consistencyDays || 0,
            }),
            plannedMetas: report?.metrics?.plannedMetas || 0,
            sealedMetas: report?.metrics?.sealedMetas || report?.metrics?.goalsMet || 0,
        };

        return {
            report: {
                ...report,
                metrics: {
                    ...report.metrics,
                    scoreModelVersion: 'fair_v2_1',
                    plannedMetas: fairness.plannedMetas,
                    sealedMetas: fairness.sealedMetas,
                    fairness,
                },
            },
            changed: report?.metrics?.scoreModelVersion !== 'fair_v2_1' || !report?.metrics?.fairness,
        };
    }

    const result = buildFairScoreFromTasks({
        tasks: atlasTasks,
        actions: [],
        arenas: [],
        previousReports,
        durationDays,
        legacyPerformanceScore,
    });

    const nextReport = {
        ...report,
        performanceScore: result.fairScore,
        metrics: {
            ...report.metrics,
            goalsMet: result.fairness.sealedMetas,
            plannedMetas: result.fairness.plannedMetas,
            sealedMetas: result.fairness.sealedMetas,
            scoreModelVersion: 'fair_v2_1',
            fairness: result.fairness,
        },
    };

    const changed = JSON.stringify({
        performanceScore: report.performanceScore,
        goalsMet: report.metrics?.goalsMet,
        plannedMetas: report.metrics?.plannedMetas,
        sealedMetas: report.metrics?.sealedMetas,
        scoreModelVersion: report.metrics?.scoreModelVersion,
        fairness: report.metrics?.fairness,
    }) !== JSON.stringify({
        performanceScore: nextReport.performanceScore,
        goalsMet: nextReport.metrics?.goalsMet,
        plannedMetas: nextReport.metrics?.plannedMetas,
        sealedMetas: nextReport.metrics?.sealedMetas,
        scoreModelVersion: nextReport.metrics?.scoreModelVersion,
        fairness: nextReport.metrics?.fairness,
    });

    return { report: nextReport, changed };
};

export const recalculateReportsWithFairScore = (reports = []) => {
    const chronological = [...reports].sort((left, right) => {
        const dateDiff = new Date(left.endDate).getTime() - new Date(right.endDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(left.startDate).getTime() - new Date(right.startDate).getTime();
    });

    const processed = [];
    const changedReportIds = [];
    const reportById = new Map();

    chronological.forEach((report) => {
        const { report: recalculated, changed } = applyFairScoreToReport(report, processed);
        processed.push(recalculated);
        reportById.set(report.id, recalculated);
        if (changed) changedReportIds.push(report.id);
    });

    return {
        reports: reports.map((report) => reportById.get(report.id) || report),
        changedReportIds,
    };
};

export const getReportFairness = (report) => report?.metrics?.fairness || null;
