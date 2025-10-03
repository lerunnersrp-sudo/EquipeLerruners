// Configuração do Firebase com os valores reais do projeto LeRunners
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDGLozMAqDoQdP_znYi3mbebUomE-_O6hU",
    authDomain: "lerunners.firebaseapp.com",
    databaseURL: "https://lerunners-default-rtdb.firebaseio.com",
    projectId: "lerunners",
    storageBucket: "lerunners.appspot.com",
    messagingSenderId: "786096020973",
    appId: "1:786096020973:web:334dc555218cedb0e1dbe4"
};

// Configuração do Cloudinary com os valores reais do projeto
const CLOUDINARY_CONFIG = {
    CLOUD_NAME: "dd6ppm6nf",
    API_KEY: "845911223412467",
    API_SECRET: "S6YefZx7J5StgcTV-greU4wFhP4"
};

// Inicializar Firebase (versão 8)
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}

// Referência global APENAS para o Realtime Database
const database = firebase.database();

console.log('Firebase v8 SDK (apenas Database) e Cloudinary configurados.');
