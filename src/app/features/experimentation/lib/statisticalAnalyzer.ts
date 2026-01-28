/**
 * Statistical Analyzer
 *
 * Calculates statistical significance, effect sizes, and provides
 * experiment analysis with chi-squared, t-tests, and Bayesian approaches.
 */

import type {
    VariantMetric,
    StatisticalTestResult,
    VariantComparison,
    ExperimentAnalysis,
    SignificanceLevel,
    Experiment,
} from "./types";

// ============================================================================
// Statistical Constants
// ============================================================================

/**
 * Z-scores for common confidence levels
 */
const Z_SCORES: Record<number, number> = {
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
    0.999: 3.291,
};

/**
 * Chi-squared critical values (df=1)
 * Reserved for future use in determining significance thresholds
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CHI_SQUARED_CRITICAL: Record<number, number> = {
    0.1: 2.706,
    0.05: 3.841,
    0.01: 6.635,
    0.001: 10.828,
};

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Standard normal cumulative distribution function (CDF)
 * Uses approximation for practical purposes
 */
function normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse normal CDF (quantile function)
 * Rational approximation
 */
function normalQuantile(p: number): number {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;

    const a = [
        -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
        1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
    ];
    const b = [
        -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
        6.680131188771972e1, -1.328068155288572e1,
    ];
    const c = [
        -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
        -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
    ];
    const d = [
        7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
        3.754408661907416e0,
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number;

    if (p < pLow) {
        q = Math.sqrt(-2 * Math.log(p));
        return (
            (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
        );
    } else if (p <= pHigh) {
        q = p - 0.5;
        r = q * q;
        return (
            ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
            (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
        );
    } else {
        q = Math.sqrt(-2 * Math.log(1 - p));
        return (
            -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
        );
    }
}

/**
 * T-distribution CDF approximation
 */
function tCDF(t: number, df: number): number {
    const x = df / (df + t * t);
    // Use normal approximation for large df
    if (df > 100) {
        return normalCDF(t);
    }
    // Beta function approximation for small df
    const a = df / 2;
    const b = 0.5;
    const betaInc = incompleteBeta(x, a, b);
    if (t >= 0) {
        return 1 - 0.5 * betaInc;
    }
    return 0.5 * betaInc;
}

/**
 * Incomplete beta function approximation
 */
function incompleteBeta(x: number, a: number, b: number): number {
    if (x === 0) return 0;
    if (x === 1) return 1;

    // Continued fraction approximation
    const maxIterations = 100;
    const epsilon = 1e-10;

    const lnBeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

    let f = 1;
    let c = 1;
    let d = 0;

    for (let m = 0; m <= maxIterations; m++) {
        const m2 = 2 * m;

        // Even step
        let aa = m === 0 ? 1 : (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < epsilon) d = epsilon;
        c = 1 + aa / c;
        if (Math.abs(c) < epsilon) c = epsilon;
        d = 1 / d;
        f *= c * d;

        // Odd step
        aa = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
        d = 1 + aa * d;
        if (Math.abs(d) < epsilon) d = epsilon;
        c = 1 + aa / c;
        if (Math.abs(c) < epsilon) c = epsilon;
        d = 1 / d;
        const delta = c * d;
        f *= delta;

        if (Math.abs(delta - 1) < epsilon) break;
    }

    return front * (f - 1);
}

/**
 * Log gamma function (Lanczos approximation)
 */
function lnGamma(z: number): number {
    const g = 7;
    const c = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ];

    if (z < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
    }

    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
        x += c[i] / (z + i);
    }

    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Chi-squared CDF
 */
function chiSquaredCDF(x: number, df: number): number {
    if (x <= 0) return 0;
    return gammaCDF(x / 2, df / 2);
}

/**
 * Gamma distribution CDF
 */
function gammaCDF(x: number, a: number): number {
    if (x <= 0) return 0;
    if (a <= 0) return 1;

    // Incomplete gamma function
    return incompleteGamma(a, x) / Math.exp(lnGamma(a));
}

/**
 * Lower incomplete gamma function
 */
function incompleteGamma(a: number, x: number): number {
    if (x < 0 || a <= 0) return 0;

    const maxIterations = 100;
    const epsilon = 1e-10;

    // Series expansion for small x
    if (x < a + 1) {
        let sum = 1 / a;
        let term = 1 / a;
        for (let n = 1; n <= maxIterations; n++) {
            term *= x / (a + n);
            sum += term;
            if (Math.abs(term) < epsilon * Math.abs(sum)) break;
        }
        return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * sum;
    }

    // Continued fraction for large x
    let b = x + 1 - a;
    let c = 1 / epsilon;
    let d = 1 / b;
    let h = d;

    for (let i = 1; i <= maxIterations; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < epsilon) d = epsilon;
        c = b + an / c;
        if (Math.abs(c) < epsilon) c = epsilon;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < epsilon) break;
    }

    return Math.exp(lnGamma(a)) - Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}

// ============================================================================
// Statistical Tests
// ============================================================================

/**
 * Two-sample Z-test for proportions
 */
export function zTestProportions(
    n1: number,
    p1: number,
    n2: number,
    p2: number,
    confidenceLevel: number = 0.95
): StatisticalTestResult {
    const pooledP = (n1 * p1 + n2 * p2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    if (se === 0) {
        return {
            testType: "z_test",
            statistic: 0,
            pValue: 1,
            significance: "not_significant",
            effectSize: 0,
            effectSizeInterpretation: "negligible",
            confidenceLevel,
        };
    }

    const z = (p1 - p2) / se;
    const pValue = 2 * (1 - normalCDF(Math.abs(z))); // Two-tailed

    // Cohen's h for proportions
    const h = 2 * (Math.asin(Math.sqrt(p1)) - Math.asin(Math.sqrt(p2)));
    const absH = Math.abs(h);

    return {
        testType: "z_test",
        statistic: z,
        pValue,
        significance: getSignificanceLevel(pValue),
        effectSize: h,
        effectSizeInterpretation: interpretEffectSize(absH, "h"),
        confidenceLevel,
    };
}

/**
 * Two-sample T-test (Welch's)
 */
export function tTestMeans(
    n1: number,
    mean1: number,
    stdDev1: number,
    n2: number,
    mean2: number,
    stdDev2: number,
    confidenceLevel: number = 0.95
): StatisticalTestResult {
    const var1 = stdDev1 * stdDev1;
    const var2 = stdDev2 * stdDev2;

    const se = Math.sqrt(var1 / n1 + var2 / n2);

    if (se === 0) {
        return {
            testType: "t_test",
            statistic: 0,
            pValue: 1,
            significance: "not_significant",
            degreesOfFreedom: n1 + n2 - 2,
            effectSize: 0,
            effectSizeInterpretation: "negligible",
            confidenceLevel,
        };
    }

    const t = (mean1 - mean2) / se;

    // Welch-Satterthwaite degrees of freedom
    const df =
        Math.pow(var1 / n1 + var2 / n2, 2) /
        (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

    const pValue = 2 * (1 - tCDF(Math.abs(t), df)); // Two-tailed

    // Cohen's d
    const pooledStdDev = Math.sqrt(
        ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2)
    );
    const d = pooledStdDev > 0 ? (mean1 - mean2) / pooledStdDev : 0;
    const absD = Math.abs(d);

    return {
        testType: "t_test",
        statistic: t,
        pValue,
        significance: getSignificanceLevel(pValue),
        degreesOfFreedom: Math.round(df),
        effectSize: d,
        effectSizeInterpretation: interpretEffectSize(absD, "d"),
        confidenceLevel,
    };
}

/**
 * Chi-squared test for categorical data
 */
export function chiSquaredTest(
    observed: number[][],
    confidenceLevel: number = 0.95
): StatisticalTestResult {
    const rows = observed.length;
    const cols = observed[0].length;

    // Calculate totals
    const rowTotals = observed.map((row) => row.reduce((a, b) => a + b, 0));
    const colTotals = observed[0].map((_, j) =>
        observed.reduce((sum, row) => sum + row[j], 0)
    );
    const total = rowTotals.reduce((a, b) => a + b, 0);

    // Calculate chi-squared statistic
    let chiSquared = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const expected = (rowTotals[i] * colTotals[j]) / total;
            if (expected > 0) {
                chiSquared += Math.pow(observed[i][j] - expected, 2) / expected;
            }
        }
    }

    const df = (rows - 1) * (cols - 1);
    const pValue = 1 - chiSquaredCDF(chiSquared, df);

    // Cramér's V for effect size
    const minDim = Math.min(rows - 1, cols - 1);
    const cramerV = minDim > 0 ? Math.sqrt(chiSquared / (total * minDim)) : 0;

    return {
        testType: "chi_squared",
        statistic: chiSquared,
        pValue,
        significance: getSignificanceLevel(pValue),
        degreesOfFreedom: df,
        effectSize: cramerV,
        effectSizeInterpretation: interpretEffectSize(cramerV, "v"),
        confidenceLevel,
    };
}

// ============================================================================
// Bayesian Analysis
// ============================================================================

/**
 * Bayesian probability that treatment is better than control
 * Uses normal approximation for proportions
 */
export function bayesianProbabilityBetter(
    nControl: number,
    pControl: number,
    nTreatment: number,
    pTreatment: number,
    simulations: number = 10000
): number {
    // Beta distribution parameters
    const alphaControl = nControl * pControl + 1;
    const betaControl = nControl * (1 - pControl) + 1;
    const alphaTreatment = nTreatment * pTreatment + 1;
    const betaTreatment = nTreatment * (1 - pTreatment) + 1;

    // Monte Carlo simulation
    let treatmentWins = 0;
    for (let i = 0; i < simulations; i++) {
        const sampleControl = sampleBeta(alphaControl, betaControl);
        const sampleTreatment = sampleBeta(alphaTreatment, betaTreatment);
        if (sampleTreatment > sampleControl) {
            treatmentWins++;
        }
    }

    return treatmentWins / simulations;
}

/**
 * Sample from Beta distribution using gamma distribution
 */
function sampleBeta(alpha: number, beta: number): number {
    const x = sampleGamma(alpha);
    const y = sampleGamma(beta);
    return x / (x + y);
}

/**
 * Sample from Gamma distribution (Marsaglia and Tsang method)
 */
function sampleGamma(shape: number): number {
    if (shape < 1) {
        return sampleGamma(1 + shape) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
        let x: number;
        let v: number;

        do {
            x = normalQuantile(Math.random());
            v = 1 + c * x;
        } while (v <= 0);

        v = v * v * v;
        const u = Math.random();

        if (u < 1 - 0.0331 * x * x * x * x) {
            return d * v;
        }

        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
            return d * v;
        }
    }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get significance level from p-value
 */
function getSignificanceLevel(pValue: number): SignificanceLevel {
    if (pValue < 0.001) return "highly_significant";
    if (pValue < 0.05) return "significant";
    if (pValue < 0.1) return "marginally";
    return "not_significant";
}

/**
 * Interpret effect size
 */
function interpretEffectSize(
    value: number,
    type: "d" | "h" | "v"
): "negligible" | "small" | "medium" | "large" {
    // Cohen's thresholds
    const thresholds = {
        d: { small: 0.2, medium: 0.5, large: 0.8 },
        h: { small: 0.2, medium: 0.5, large: 0.8 },
        v: { small: 0.1, medium: 0.3, large: 0.5 },
    };

    const t = thresholds[type];
    if (value < t.small) return "negligible";
    if (value < t.medium) return "small";
    if (value < t.large) return "medium";
    return "large";
}

/**
 * Calculate confidence interval for a proportion
 */
export function confidenceIntervalProportion(
    n: number,
    p: number,
    confidenceLevel: number = 0.95
): { lower: number; upper: number } {
    const z = Z_SCORES[confidenceLevel] || 1.96;
    const se = Math.sqrt((p * (1 - p)) / n);
    return {
        lower: Math.max(0, p - z * se),
        upper: Math.min(1, p + z * se),
    };
}

/**
 * Calculate confidence interval for a mean
 */
export function confidenceIntervalMean(
    n: number,
    mean: number,
    stdDev: number,
    confidenceLevel: number = 0.95
): { lower: number; upper: number } {
    const z = Z_SCORES[confidenceLevel] || 1.96;
    const se = stdDev / Math.sqrt(n);
    return {
        lower: mean - z * se,
        upper: mean + z * se,
    };
}

// ============================================================================
// Full Analysis
// ============================================================================

/**
 * Compare two variants
 */
export function compareVariants(
    control: VariantMetric,
    treatment: VariantMetric,
    isConversion: boolean = false,
    confidenceLevel: number = 0.95
): VariantComparison {
    let testResult: StatisticalTestResult;
    let probabilityBetter: number;

    if (isConversion) {
        // Use Z-test for proportions
        testResult = zTestProportions(
            control.sampleSize,
            control.conversionRate || 0,
            treatment.sampleSize,
            treatment.conversionRate || 0,
            confidenceLevel
        );

        probabilityBetter = bayesianProbabilityBetter(
            control.sampleSize,
            control.conversionRate || 0,
            treatment.sampleSize,
            treatment.conversionRate || 0
        );
    } else {
        // Use T-test for continuous metrics
        testResult = tTestMeans(
            control.sampleSize,
            control.mean,
            control.stdDev,
            treatment.sampleSize,
            treatment.mean,
            treatment.stdDev,
            confidenceLevel
        );

        // Approximate Bayesian probability for continuous (using effect size)
        const se = Math.sqrt(
            (control.stdDev * control.stdDev) / control.sampleSize +
            (treatment.stdDev * treatment.stdDev) / treatment.sampleSize
        );
        const z = se > 0 ? (treatment.mean - control.mean) / se : 0;
        probabilityBetter = normalCDF(z);
    }

    const relativeLift =
        control.mean !== 0 ? ((treatment.mean - control.mean) / control.mean) * 100 : 0;

    const absoluteDifference = treatment.mean - control.mean;

    // Determine recommendation
    let recommendation: "keep_control" | "adopt_treatment" | "continue_testing";
    if (testResult.significance === "significant" || testResult.significance === "highly_significant") {
        recommendation = absoluteDifference > 0 ? "adopt_treatment" : "keep_control";
    } else {
        recommendation = "continue_testing";
    }

    return {
        controlId: control.variantId,
        treatmentId: treatment.variantId,
        metricName: control.metricName,
        control,
        treatment,
        relativeLift,
        absoluteDifference,
        testResult,
        probabilityBetter,
        recommendation,
    };
}

/**
 * Analyze a full experiment
 */
export function analyzeExperiment(
    experiment: Experiment,
    variantMetrics: Record<string, VariantMetric[]>,
    confidenceLevel: number = 0.95
): ExperimentAnalysis {
    const warnings: string[] = [];
    const comparisons: VariantComparison[] = [];

    // Find control variant
    const controlVariant = experiment.variants.find((v) => v.isControl);
    if (!controlVariant) {
        warnings.push("No control variant found");
    }

    const controlMetrics = controlVariant
        ? variantMetrics[controlVariant.id] || []
        : [];

    // Count total participants
    let totalParticipants = 0;
    for (const metrics of Object.values(variantMetrics)) {
        const primaryMetric = metrics.find((m) => m.metricName === experiment.primaryMetric);
        if (primaryMetric) {
            totalParticipants += primaryMetric.sampleSize;
        }
    }

    // Check sample size
    const minPerVariant = experiment.minSampleSize;
    for (const [variantId, metrics] of Object.entries(variantMetrics)) {
        const primaryMetric = metrics.find((m) => m.metricName === experiment.primaryMetric);
        if (primaryMetric && primaryMetric.sampleSize < minPerVariant) {
            warnings.push(
                `Variant ${variantId} has ${primaryMetric.sampleSize} samples (min: ${minPerVariant})`
            );
        }
    }

    // Compare each treatment to control
    const isConversion = experiment.primaryMetric.includes("conversion") ||
        experiment.primaryMetric.includes("completed");

    for (const treatment of experiment.variants) {
        if (treatment.isControl) continue;

        const treatmentMetrics = variantMetrics[treatment.id] || [];
        const controlPrimary = controlMetrics.find(
            (m) => m.metricName === experiment.primaryMetric
        );
        const treatmentPrimary = treatmentMetrics.find(
            (m) => m.metricName === experiment.primaryMetric
        );

        if (controlPrimary && treatmentPrimary) {
            comparisons.push(
                compareVariants(controlPrimary, treatmentPrimary, isConversion, confidenceLevel)
            );
        }
    }

    // Determine winner
    let winner: ExperimentAnalysis["winner"] | undefined;
    const significantWinners = comparisons.filter(
        (c) =>
            (c.testResult.significance === "significant" ||
                c.testResult.significance === "highly_significant") &&
            c.absoluteDifference > 0
    );

    if (significantWinners.length === 1) {
        const w = significantWinners[0];
        winner = {
            variantId: w.treatmentId,
            confidence: 1 - w.testResult.pValue,
            metric: experiment.primaryMetric,
        };
    } else if (significantWinners.length > 1) {
        warnings.push("Multiple variants show significant improvement");
    }

    // Calculate MDE at current sample
    const controlPrimary = controlMetrics.find(
        (m) => m.metricName === experiment.primaryMetric
    );
    const mde = controlPrimary
        ? calculateMDE(
            controlPrimary.sampleSize,
            controlPrimary.mean,
            controlPrimary.stdDev,
            0.8,
            experiment.significanceThreshold
        )
        : 0;

    // Estimate power
    const power = comparisons.length > 0
        ? estimatePower(comparisons[0].control, comparisons[0].treatment, experiment.significanceThreshold)
        : 0;

    return {
        experimentId: experiment.id,
        analyzedAt: new Date().toISOString(),
        totalParticipants,
        variantMetrics,
        comparisons,
        winner,
        mde,
        power,
        warnings,
    };
}

/**
 * Calculate Minimum Detectable Effect
 */
function calculateMDE(
    n: number,
    baseline: number,
    stdDev: number,
    targetPower: number = 0.8,
    alpha: number = 0.05
): number {
    const zAlpha = normalQuantile(1 - alpha / 2);
    const zBeta = normalQuantile(targetPower);
    const se = stdDev / Math.sqrt(n / 2); // Assuming equal split

    return ((zAlpha + zBeta) * se) / baseline * 100; // As percentage
}

/**
 * Estimate statistical power
 */
function estimatePower(
    control: VariantMetric,
    treatment: VariantMetric,
    alpha: number = 0.05
): number {
    const pooledStdDev = Math.sqrt(
        ((control.sampleSize - 1) * control.stdDev * control.stdDev +
            (treatment.sampleSize - 1) * treatment.stdDev * treatment.stdDev) /
        (control.sampleSize + treatment.sampleSize - 2)
    );

    const effectSize = Math.abs(treatment.mean - control.mean) / pooledStdDev;
    const nHarmonic = (2 * control.sampleSize * treatment.sampleSize) /
        (control.sampleSize + treatment.sampleSize);

    const ncp = effectSize * Math.sqrt(nHarmonic / 2); // Non-centrality parameter
    const criticalZ = normalQuantile(1 - alpha / 2);

    return normalCDF(ncp - criticalZ) + normalCDF(-ncp - criticalZ);
}
