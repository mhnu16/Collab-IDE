import React from 'react'
import '../styles/ErrorPage.scss'

export default function ErrorPage({ code }: { code: number }) {
    let message = '';

    switch (code) {
        case 404:
            message = 'The page you are looking for does not exist';
            break;
        case 403:
            message = 'You are not authorized to view this page';
            break;
        default:
            message = 'An unknown error occurred';
            break;
    }

    return (
        <div className='error-page'>
            <h1>Error {code}</h1>
            <p>{message}</p>
        </div>
    )
}