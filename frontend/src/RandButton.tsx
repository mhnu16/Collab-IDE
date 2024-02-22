import jquery from "jquery";

function getRand() {
  return new Promise<RandResponse>((resolve, reject) => {
    jquery.ajax({
      url: "/api/rand",
      method: "GET",
      success: (res: RandResponse) => {
        resolve(res);
      },
      error: (err) => {
        // Checks if the request was unauthorized
        if (err.status === 401) {
          // Redirects to the login page
          window.location.href = "/login";
        } else {
          reject(err);
        }
      },
    });
  });
}

export default function RandButton({
  data,
  setData,
}: {
  data: string;
  setData: (data: string) => void;
}) {
  return (
    <button
      onClick={() => {
        getRand().then(
          (res) => {
            setData(res.rand.toString());
          },
          (err) => {
            console.error(err);
          }
        );
      }}
    >
      {data ? data : "fetch data"}
    </button>
  );
}

interface RandResponse {
  rand: number;
}
