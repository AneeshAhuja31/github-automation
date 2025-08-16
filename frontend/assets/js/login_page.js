document.addEventListener('DOMContentLoaded',function () {
    const githubButton = document.querySelector('.github-button')
    if(githubButton){
        githubButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'http://localhost:8000/auth/login';
        })
    }
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error){
        console.error('Login error:',error);
        alert('Login failed: '+error)
    }
})