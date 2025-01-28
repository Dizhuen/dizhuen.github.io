document.addEventListener('DOMContentLoaded', () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const nav = document.querySelector('.nav');
    const logoLink = document.querySelector('.logo');

    if (burgerMenu && nav) { // Проверка, что элементы найдены
        burgerMenu.addEventListener('click', (e) => {
            e.preventDefault(); // Добавлено для предотвращения поведения по умолчанию, если button type="submit"
            burgerMenu.classList.toggle('active');
            nav.classList.toggle('open');
        });
    } else {
        console.error("Бургер-меню или навигация не найдены!"); // Сообщение об ошибке, если элементы не найдены
    }


    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            burgerMenu.classList.remove('active');
            nav.classList.remove('open');
        });
    });

    logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = './'; // Главная страница - теперь относительный путь
    });
});