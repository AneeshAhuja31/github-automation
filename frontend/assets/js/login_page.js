document.addEventListener('DOMContentLoaded',async function () {
    try{
        const res = await fetch("http://localhost:8000/auth/me",{
            method:"GET",
            credentials:'include'
        })
        if(res.ok){
            const data = await res.json();
            if(data.username){
                window.location.href = 'http://localhost:3000/dashboard.html';
                return;
            }
        }
    }
    catch(err){
        console.error('Auth validation error: ',err);
    }
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