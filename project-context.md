# Project Context: Last-Mile Delivery Tracker

## Product

A web and mobile system for tracking packages from the local
delivery hub to the customer information.

- Each status update records a time and location.
- Customer service can view the delivery-event history.

## Constraints

- Do not include real customer addresses, names, or package IDs
  in GenAI prompts.
- Status changes must preserve an audit history.
- The system must support poor cellular connectivity for drivers.
- Managers approve operational policies; the team does not invent
  them.

## Open questions

- Which delivery statuses are allowed?
- How long should a driver be able to work offline?
- When should the system notify a customer about a delay?
- What information may managers see about driver performance?

## Task prompt pattern

Using only the evidence and confirmed decisions above:

1. Draft one user story for a named user.
2. Draft Given / When / Then acceptance criteria.
3. List assumptions separately.
4. List questions that require a manager or stakeholder decision.
5. Do not invent policy, timing, or privacy requirements.
