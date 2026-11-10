(function () {
  'use strict';
  function calculateVenture(input) {
    const enquiries = Math.floor(input.visits * input.enquiry / 100);
    const orders = Math.floor(enquiries * input.close / 100);
    const capacity = Math.floor(input.hours * 60 / input.minutes);
    const fulfilled = Math.min(orders, capacity);
    const ownerHours = fulfilled * input.minutes / 60;
    const revenue = fulfilled * input.price;
    const directCost = fulfilled * 12;
    const cash = revenue - directCost - 300 - 60;
    return { enquiries, orders, capacity, fulfilled, unfilled: orders - fulfilled, ownerHours,
      revenue, directCost, cash, economic: cash - ownerHours * 30,
      acquisitionPerCustomer: fulfilled ? 300 / fulfilled : null };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculateVenture };
  if (typeof document === 'undefined') return;
  const root = document.querySelector('.venture-workbench');
  if (!root) return;
  const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  const number = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
  const inputs = [...root.querySelectorAll('[data-venture-input]')];
  let reference = null;
  function state() { return Object.fromEntries(inputs.map(el => [el.dataset.ventureInput, Number(el.value)])); }
  function render() {
    const input = state(), result = calculateVenture(input);
    for (const el of inputs) {
      const key = el.dataset.ventureInput;
      const unit = key === 'visits' ? ' visits' : key === 'minutes' ? ' minutes' : key === 'hours' ? ' hours' : '%';
      const label = key === 'price' ? money(input[key]) : number(input[key]) + unit;
      root.querySelector(`#venture-${key}-value`).textContent = label;
      el.setAttribute('aria-valuetext', label);
    }
    const funnel = [['Reachable visits', input.visits], ['Enquiries', result.enquiries], ['Orders', result.orders], ['Fulfilled orders', result.fulfilled]];
    root.querySelector('#venture-funnel-bars').innerHTML = funnel.map(([label, value]) => `<div class="venture-bar-row"><span>${label}</span><strong>${number(value)}</strong><div class="venture-bar-track"><div style="width:${100 * value / input.visits}%"></div></div></div>`).join('');
    const headline = result.unfilled ? `${result.unfilled} orders exceed delivery capacity. Plan a waitlist, a smaller offer, or more capacity before accepting them.` : `Capacity covers this scenario's ${result.orders} orders. Demand, price, and delivery quality still need evidence.`;
    root.querySelector('#venture-headline').textContent = headline;
    const rows = [
      ['Delivery capacity', `${result.capacity} orders`, 'Whole orders supported by available owner time.'],
      ['Collected revenue', money(result.revenue), 'Fulfilled orders × price; no collection delay assumed.'],
      ['Direct cash delivery cost', money(result.directCost), '$12 for each fulfilled order.'],
      ['Acquisition + software', money(360), '$300 acquisition and $60 software per month.'],
      ['Cash operating remainder', money(result.cash), 'Before owner pay, tax, setup, and other excluded costs.'],
      ['Owner delivery and review', `${number(result.ownerHours)} hours · ${money(result.ownerHours * 30)}`, 'Time valued at $30/hour; this is not a separate cash payment.'],
      ['Contribution after valuing owner time', money(result.economic), 'Cash operating remainder minus the value of owner time.'],
      ['Acquisition spend per fulfilled customer', result.acquisitionPerCustomer === null ? 'Not defined — no deliveries' : money(result.acquisitionPerCustomer), '$300 divided by fulfilled customers; a scenario estimate, not measured CAC.']
    ];
    root.querySelector('#venture-results').innerHTML = rows.map(([label, value, meaning]) => `<tr><th scope="row">${label}</th><td>${value}</td><td>${meaning}</td></tr>`).join('');
    if (reference) {
      const delta = result.fulfilled - reference.result.fulfilled;
      const changed = inputs.filter(el => input[el.dataset.ventureInput] !== reference.input[el.dataset.ventureInput]).map(el => {
        const key = el.dataset.ventureInput;
        return `${root.querySelector(`label[for="${el.id}"]`).textContent}: ${reference.input[key]} → ${input[key]}`;
      });
      root.querySelector('#venture-comparison').textContent = `Compared with your reference: ${delta >= 0 ? '+' : ''}${delta} fulfilled orders; cash remainder changes by ${result.cash >= reference.result.cash ? '+' : ''}${money(result.cash - reference.result.cash)}; contribution after owner time changes by ${result.economic >= reference.result.economic ? '+' : ''}${money(result.economic - reference.result.economic)}. ${changed.length ? 'Changed assumptions: ' + changed.join('; ') + '.' : 'No assumptions changed.'}`;
    }
  }
  inputs.forEach(el => el.addEventListener('input', render));
  root.querySelector('#venture-save').addEventListener('click', () => { const input = state(); reference = { input, result: calculateVenture(input) }; render(); });
  render();
})();
