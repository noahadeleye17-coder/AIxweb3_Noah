// Fallback data in the exact shape of the Apidog responses (see mock-api/apidog/examples).
// Synthetic only. Used when VITE_API_BASE_URL is empty or an endpoint fails.
export const sampleRaw = {
  customer: {
    id: "customer_001",
    household: {
      name: "Household A",
      location: "Lagos, Nigeria",
      members: [
        { id: "person_001", name: "Member A", age: 29, monthly_income: 450000 },
        { id: "person_002", name: "Member B", age: 27, monthly_income: 400000 },
      ],
    },
    currency: "NGN",
    current_savings_balance: 650000,
    savings_goal: {
      target_amount: 2000000,
      target_date: "2027-10-01",
      purpose: "Personal financial goal",
    },
  },
  transactions: {
    customer_id: "customer_001",
    currency: "NGN",
    transactions: [
      {
        id: "txn_001",
        date: "2026-06-05",
        type: "expense",
        category: "electricity",
        description: "Electricity bill",
        amount: 35000,
      },
      {
        id: "txn_002",
        date: "2026-06-08",
        type: "expense",
        category: "transportation",
        description: "Transport expenses",
        amount: 72000,
      },
      {
        id: "txn_003",
        date: "2026-06-12",
        type: "expense",
        category: "groceries",
        description: "Monthly grocery shopping",
        amount: 85000,
      },
    ],
  },
  savings: {
    customer_id: "customer_001",
    currency: "NGN",
    current_balance: 650000,
    total_contributed: 650000,
    total_withdrawn: 0,
    monthly_target: 166667,
    contribution_frequency: "monthly",
    history: [
      {
        month: "2026-01",
        planned_contribution: 166667,
        actual_contribution: 150000,
        balance_after: 150000,
      },
      {
        month: "2026-02",
        planned_contribution: 166667,
        actual_contribution: 160000,
        balance_after: 310000,
      },
      {
        month: "2026-03",
        planned_contribution: 166667,
        actual_contribution: 140000,
        balance_after: 450000,
      },
      {
        month: "2026-04",
        planned_contribution: 166667,
        actual_contribution: 100000,
        balance_after: 550000,
      },
      {
        month: "2026-05",
        planned_contribution: 166667,
        actual_contribution: 0,
        balance_after: 550000,
      },
      {
        month: "2026-06",
        planned_contribution: 166667,
        actual_contribution: 100000,
        balance_after: 650000,
      },
    ],
  },
  goal: {
    customer_id: "customer_001",
    goal_id: "goal_001",
    name: "Household savings goal",
    purpose: "Personal financial goal",
    target_amount: 2000000,
    current_balance: 650000,
    amount_remaining: 1350000,
    target_date: "2027-10-01",
    months_remaining: 11,
    status: "behind",
    progress_percentage: 32.5,
    original_monthly_target: 166667,
    current_required_monthly_contribution: 122728,
  },
};
