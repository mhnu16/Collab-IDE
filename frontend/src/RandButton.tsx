import { sendRequest } from "./ServerApi"

export default function RandButton({
  data,
  setData,
}: {
  data: string;
  setData: (data: string) => void;
}) {
  function getRand() {
    sendRequest("/api/rand", "GET", null).then(
      (res) => {
        setData(res.data.rand.toString());
      },
      (err) => {
        if (err.status === 401) {
          console.error(err.responseJSON.data.error)
          window.location.href = "/login";
        }
      }
    )
  }

  return (
    <button
      onClick={
        () => getRand()
      }
    >
      {data ? data : "fetch data"}
    </button>
  );
}
