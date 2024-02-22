import jquery from 'jquery';

function getRand() {
    return jquery.get('/api/rand').then((res: RandResponse) => res.rand);
};

export default function RandButton(
    { data, setData }:
        { data: string, setData: (data: string) => void }
) {
    return (
        <button onClick={() => getRand().then((rand) => setData(rand.toString()))}>
            {data ? data : 'fetch data'}
        </button>
    );
}

interface RandResponse {
    rand: number
}
