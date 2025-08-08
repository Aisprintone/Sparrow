/**
 * Retirement Calculator
 * Handles retirement planning calculations and projections
 */

export class RetirementCalculator {
  constructor() {
    this.defaultInflationRate = 0.025; // 2.5% annual inflation
    this.defaultLifeExpectancy = 85;
  }

  /**
   * Calculate retirement projection
   */
  calculateRetirementProjection({
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    expectedReturn,
    inflationRate = this.defaultInflationRate,
    lifeExpectancy = this.defaultLifeExpectancy,
    desiredIncome = null
  }) {
    try {
      // Validate inputs
      this.validateRetirementInputs({
        currentAge,
        retirementAge,
        currentSavings,
        monthlyContribution,
        expectedReturn,
        inflationRate
      });

      const yearsToRetirement = retirementAge - currentAge;
      const yearsInRetirement = lifeExpectancy - retirementAge;

      // Calculate savings at retirement
      const savingsAtRetirement = this.calculateFutureValue({
        presentValue: currentSavings,
        monthlyContribution,
        years: yearsToRetirement,
        annualReturn: expectedReturn
      });

      // Calculate required retirement income
      const requiredIncome = desiredIncome || this.calculateRequiredIncome({
        currentAge,
        retirementAge,
        currentSavings,
        monthlyContribution,
        expectedReturn,
        inflationRate
      });

      // Calculate retirement income needs (adjusted for inflation)
      const inflationAdjustedIncome = this.adjustForInflation(
        requiredIncome,
        yearsToRetirement,
        inflationRate
      );

      // Calculate monthly retirement income needed
      const monthlyRetirementIncome = inflationAdjustedIncome / 12;

      // Calculate if savings are sufficient
      const retirementSavingsNeeded = this.calculateRetirementSavingsNeeded({
        monthlyIncome: monthlyRetirementIncome,
        years: yearsInRetirement,
        inflationRate,
        expectedReturn
      });

      const isSufficient = savingsAtRetirement >= retirementSavingsNeeded;
      const shortfall = Math.max(0, retirementSavingsNeeded - savingsAtRetirement);

      // Generate year-by-year projection
      const projection = this.generateYearlyProjection({
        currentAge,
        retirementAge,
        currentSavings,
        monthlyContribution,
        expectedReturn,
        inflationRate,
        lifeExpectancy
      });

      return {
        summary: {
          currentAge,
          retirementAge,
          yearsToRetirement,
          yearsInRetirement,
          currentSavings,
          monthlyContribution,
          expectedReturn,
          inflationRate,
          savingsAtRetirement: Math.round(savingsAtRetirement * 100) / 100,
          requiredMonthlyIncome: Math.round(monthlyRetirementIncome * 100) / 100,
          retirementSavingsNeeded: Math.round(retirementSavingsNeeded * 100) / 100,
          isSufficient,
          shortfall: Math.round(shortfall * 100) / 100
        },
        recommendations: this.generateRetirementRecommendations({
          isSufficient,
          shortfall,
          yearsToRetirement,
          monthlyContribution,
          expectedReturn
        }),
        projection
      };
    } catch (error) {
      throw new Error(`Retirement calculation error: ${error.message}`);
    }
  }

  /**
   * Calculate future value of investments
   */
  calculateFutureValue({
    presentValue,
    monthlyContribution,
    years,
    annualReturn
  }) {
    const monthlyReturn = annualReturn / 12;
    const months = years * 12;

    // Future value of present value
    const futureValueOfPresent = presentValue * Math.pow(1 + annualReturn, years);

    // Future value of monthly contributions
    const futureValueOfContributions = monthlyContribution * 
      ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);

    return futureValueOfPresent + futureValueOfContributions;
  }

  /**
   * Calculate required retirement income based on current lifestyle
   */
  calculateRequiredIncome({
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    expectedReturn
  }) {
    // Estimate current annual income based on savings and contributions
    const estimatedCurrentIncome = (currentSavings * expectedReturn + 
      monthlyContribution * 12) / 0.3; // Assume 30% savings rate

    // Assume 80% of current income needed in retirement
    return estimatedCurrentIncome * 0.8;
  }

  /**
   * Adjust amount for inflation over years
   */
  adjustForInflation(amount, years, inflationRate) {
    return amount * Math.pow(1 + inflationRate, years);
  }

  /**
   * Calculate retirement savings needed
   */
  calculateRetirementSavingsNeeded({
    monthlyIncome,
    years,
    inflationRate,
    expectedReturn
  }) {
    const realReturn = (1 + expectedReturn) / (1 + inflationRate) - 1;
    const months = years * 12;
    const monthlyRealReturn = realReturn / 12;

    return monthlyIncome * 
      ((1 - Math.pow(1 + monthlyRealReturn, -months)) / monthlyRealReturn);
  }

  /**
   * Generate year-by-year projection
   */
  generateYearlyProjection({
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    expectedReturn,
    inflationRate,
    lifeExpectancy
  }) {
    const projection = [];
    let currentBalance = currentSavings;

    for (let age = currentAge; age <= lifeExpectancy; age++) {
      const isRetirementYear = age >= retirementAge;
      const monthlyIncome = isRetirementYear ? 
        this.calculateMonthlyRetirementIncome(currentBalance, lifeExpectancy - age) : 0;
      
      if (isRetirementYear) {
        currentBalance -= monthlyIncome * 12;
      } else {
        // Pre-retirement: add contributions and returns
        currentBalance = this.calculateFutureValue({
          presentValue: currentBalance,
          monthlyContribution,
          years: 1,
          annualReturn: expectedReturn
        });
      }

      projection.push({
        age,
        year: new Date().getFullYear() + (age - currentAge),
        balance: Math.round(currentBalance * 100) / 100,
        monthlyIncome: Math.round(monthlyIncome * 100) / 100,
        phase: isRetirementYear ? 'retirement' : 'accumulation'
      });
    }

    return projection;
  }

  /**
   * Calculate monthly retirement income from savings
   */
  calculateMonthlyRetirementIncome(savings, yearsRemaining) {
    const months = yearsRemaining * 12;
    const monthlyWithdrawal = savings / months;
    return monthlyWithdrawal;
  }

  /**
   * Generate retirement recommendations
   */
  generateRetirementRecommendations({
    isSufficient,
    shortfall,
    yearsToRetirement,
    monthlyContribution,
    expectedReturn
  }) {
    const recommendations = [];

    if (!isSufficient) {
      // Calculate additional monthly contribution needed
      const additionalContribution = this.calculateAdditionalContribution({
        shortfall,
        yearsToRetirement,
        expectedReturn
      });

      recommendations.push({
        type: 'increase_contribution',
        message: `Increase monthly contribution by $${Math.round(additionalContribution * 100) / 100}`,
        priority: 'high'
      });

      recommendations.push({
        type: 'extend_retirement',
        message: `Consider working ${Math.ceil(shortfall / (monthlyContribution * 12))} additional years`,
        priority: 'medium'
      });
    }

    if (expectedReturn < 0.06) {
      recommendations.push({
        type: 'increase_return',
        message: 'Consider increasing investment returns through diversification',
        priority: 'medium'
      });
    }

    if (yearsToRetirement < 10) {
      recommendations.push({
        type: 'catch_up',
        message: 'Consider catch-up contributions if eligible',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Calculate additional contribution needed
   */
  calculateAdditionalContribution({
    shortfall,
    years,
    expectedReturn
  }) {
    const monthlyReturn = expectedReturn / 12;
    const months = years * 12;

    return shortfall / 
      ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
  }

  /**
   * Validate retirement calculation inputs
   */
  validateRetirementInputs({
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    expectedReturn,
    inflationRate
  }) {
    if (currentAge < 18 || currentAge > 100) {
      throw new Error('Current age must be between 18 and 100');
    }

    if (retirementAge <= currentAge) {
      throw new Error('Retirement age must be greater than current age');
    }

    if (currentSavings < 0) {
      throw new Error('Current savings cannot be negative');
    }

    if (monthlyContribution < 0) {
      throw new Error('Monthly contribution cannot be negative');
    }

    if (expectedReturn < 0 || expectedReturn > 0.2) {
      throw new Error('Expected return must be between 0% and 20%');
    }

    if (inflationRate < 0 || inflationRate > 0.1) {
      throw new Error('Inflation rate must be between 0% and 10%');
    }
  }
} 