const profile = require("../config/profile");

const normalizeText = (text = "") => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const containsAny = (text, terms) => {
    const normalizedText = normalizeText(text);

    return terms.some((term) =>
        normalizedText.includes(normalizeText(term))
    );
};

const checkSeniority = (job) => {
    const jobText = normalizeText(
        `${job.title || ""} ${job.description || ""}`
    );

    return profile.seniorityExclusions.filter((level) =>
        containsAny(jobText, [level])
    );
};

const checkJobExclusions = (job) => {
    const jobText = normalizeText(
        `${job.title || ""} ${job.description || ""}`
    );

    const reasons = [];

    // 1. Inglés avanzado
    const advancedEnglishTerms = [
        "c1",
        "c2",
        "advanced english",
        "english advanced",
    ];

    if (
        profile.exclusions.advancedEnglish &&
        containsAny(jobText, advancedEnglishTerms)
    ) {
        reasons.push("Exige inglés avanzado");
    }

    // 2. Presencial fuera de Santiago
    const isOnsite = containsAny(jobText, [
        "on-site",
        "onsite",
        "presencial",
        "presencialmente",
    ]);

    const isSantiago = containsAny(jobText, [
        "santiago",
        "santiago de chile",
    ]);

    if (
        profile.exclusions.onsiteOutsideSantiago &&
        isOnsite &&
        !isSantiago
    ) {
        reasons.push("Presencial fuera de Santiago");
    }

    // 3. Cargo no relacionado con desarrollo
    const developmentTerms = [
        "developer",
        "desarrollador",
        "software engineer",
        "frontend",
        "backend",
        "full stack",
        "fullstack",
        "programador",
        "software",
        "react",
        "node.js",
        "python",
        "javascript",
        "sapui5",
        "fiori",
    ];

    if (
        profile.exclusions.unrelatedToDevelopment &&
        !containsAny(jobText, developmentTerms)
    ) {
        reasons.push("No parece ser un cargo de desarrollo de software");
    }

    const isBackendRole = containsAny(jobText, [
        "backend",
        "back-end",
        "desarrollador backend",
        "desarrollador back-end",
    ]);

    const hasJavaBackendStack = containsAny(jobText, [
        "java",
        "quarkus",
        "spring boot",
    ]);

    const hasSecondaryPrimaryStack =
        jobText.includes("node.js") &&
        (
            jobText.includes("complementario") ||
            jobText.includes("complementaria")
        );

    if (
        isBackendRole &&
        hasJavaBackendStack &&
        hasSecondaryPrimaryStack
    ) {
        reasons.push("El stack principal parece estar centrado en Java y Node.js es complementario");
    }

    return {
        excluded: reasons.length > 0,
        reasons,
    };
};

const calculateJobMatch = (job) => {
    const jobText = normalizeText(
        `${job.title || ""} ${job.description || ""}`
    );

    const matchedPrimaryStack = Object.entries(profile.primaryStack)
        .filter(([skill, aliases]) => containsAny(jobText, aliases))
        .map(([skill]) => skill);

    const matchedHighPrioritySkills = profile.highPrioritySkills.filter(
        (skill) =>
            !Object.keys(profile.primaryStack).includes(skill) &&
            containsAny(jobText, [skill])
    );

    const matchedMediumPrioritySkills = profile.mediumPrioritySkills.filter(
        (skill) => containsAny(jobText, [skill])
    );

    const matchedAISkills = profile.aiSkills.filter(
        (skill) => containsAny(jobText, [skill])
    );

    const titleText = normalizeText(job.title || "");

    const matchedRoles = Object.entries(profile.roleAliases)
        .filter(([role, aliases]) => containsAny(titleText, aliases))
        .map(([role]) => role);

    let score = 0;

    score += matchedPrimaryStack.length * 12;
    score += matchedHighPrioritySkills.length * 6;
    score += matchedMediumPrioritySkills.length * 3;
    score += matchedAISkills.length * 2;
    score += matchedRoles.length * 8;

    const seniorityMatches = checkSeniority(job);
    const exclusions = checkJobExclusions(job);

    return {
        score,
        excluded: exclusions.excluded,
        exclusionReasons: exclusions.reasons,
        seniorityMatches,
        matchedRoles,
        matchedPrimaryStack,
        matchedHighPrioritySkills,
        matchedMediumPrioritySkills,
        matchedAISkills,
    };
};

const isRelevantJob = (matchResult) => {
    if (matchResult.excluded) {
        return false;
    }

    if (matchResult.seniorityMatches.length > 0) {
        return false;
    }

    if (matchResult.matchedRoles.length === 0) {
        return false;
    }

    if (
        matchResult.matchedRoles.includes("Backend Developer") &&
        !matchResult.matchedRoles.includes("Full Stack Developer")
    ) {
        const backendStack = ["Node.js", "Python", "JavaScript", "SAPUI5", "SAP Fiori"];

        const hasBackendStack = matchResult.matchedPrimaryStack.some((skill) =>
            backendStack.includes(skill)
        );

        if (!hasBackendStack) {
            return false;
        }
    }

    return (
        matchResult.score >= 30 &&
        matchResult.matchedPrimaryStack.length >= 2
    );
};

module.exports = {
    calculateJobMatch,
    checkJobExclusions,
    isRelevantJob,
    checkSeniority,
};