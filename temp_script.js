function toggleMobileNav() {
const mobileNav = document.querySelector('.mobile-nav');
const overlay = document.querySelector('.mobile-overlay');
mobileNav.classList.toggle('open');
overlay.classList.toggle('open');
document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : 'auto';
}
function openModal() {
const modal = document.getElementById('scheduleModal');
modal.classList.remove('hidden');
modal.classList.add('flex');
document.body.style.overflow = 'hidden';
}function closeModal() {
const modal = document.getElementById('scheduleModal');
modal.classList.add('hidden');
modal.classList.remove('flex');
document.body.style.overflow = 'auto';
}
let currentFuel = 'diesel';
const fuelData = {
diesel: { unit: 'L', name: 'Diesel', price: 1200, qty: 150, minP: 800, maxP: 1500 },
petrol: { unit: 'L', name: 'Petrol', price: 670, qty: 100, minP: 500, maxP: 1000 },
gas: { unit: 'scm', name: 'Gas', price: 450, qty: 200, minP: 200, maxP: 800 }
};const fuelQtyInput = document.getElementById('fuelQuantity');
const fuelPriceInput = document.getElementById('fuelPrice');
const quantityVal = document.getElementById('quantityVal');
const priceVal = document.getElementById('priceVal');
const currentSpend = document.getElementById('currentSpend');
const savings = document.getElementById('savings');
const annualSavings = document.getElementById('annualSavings');const quantityLabel = document.getElementById('quantityLabel');
const priceLabel = document.getElementById('priceLabel');
const minPriceLabel = document.getElementById('minPrice');
const maxPriceLabel = document.getElementById('maxPrice');function setFuel(type) {
currentFuel = type;
const data = fuelData[type];
['diesel', 'petrol', 'gas'].forEach(f => {
const btn = document.getElementById('btn-' + f);
if (f === type) {
btn.classList.add('bg-yellow-500', 'text-slate-900');
btn.classList.remove('hover:bg-slate-700');
} else {
btn.classList.remove('bg-yellow-500', 'text-slate-900');
btn.classList.add('hover:bg-slate-700');
}
});
quantityLabel.textContent = `Daily ${data.name} Consumption (${data.unit})`;
priceLabel.textContent = `Price per ${data.unit === 'L' ? 'Litre' : data.unit} (₦)`;
minPriceLabel.textContent = `₦${data.minP}`;
maxPriceLabel.textContent = `₦${data.maxP}`;
fuelPriceInput.min = data.minP;
fuelPriceInput.max = data.maxP;
fuelPriceInput.value = data.price;
fuelQtyInput.value = data.qty;updateCalculator();
}function updateCalculator() {
const data = fuelData[currentFuel];
const qty = parseFloat(fuelQtyInput.value);
const price = parseFloat(fuelPriceInput.value);
quantityVal.textContent = qty + ' ' + data.unit;
priceVal.textContent = '₦' + price.toLocaleString();
const monthlySpend = qty * price * 30;
const monthlySavings = monthlySpend * .85;
const yearSavings = monthlySavings * 12;currentSpend.textContent = '₦' + Math.round(monthlySpend).toLocaleString();
savings.textContent = '₦' + Math.round(monthlySavings).toLocaleString();
annualSavings.textContent = '₦' + Math.round(yearSavings).toLocaleString();
}fuelQtyInput.addEventListener('input', updateCalculator);
fuelPriceInput.addEventListener('input', updateCalculator);
const sections = document.querySelectorAll('section, header');
const navLinks = document.querySelectorAll('.sidebar-link');window.addEventListener('scroll', () => {
let current = '';
sections.forEach(section => {
const sectionTop = section.offsetTop;
const sectionHeight = section.clientHeight;
if (pageYOffset >= sectionTop - 200) {
current = section.getAttribute('id');
}
});navLinks.forEach(link => {
link.classList.remove('active-link');
if (link.getAttribute('href').includes(current)) {
link.classList.add('active-link');
}
});
});
updateCalculator();
