import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
    scenarios: {
        api_load: {
            executor: "constant-vus",
            vus: 10,
            duration: "30s",
        },
    },
    thresholds: {
        http_req_failed: ["rate<0.05"],
        http_req_duration: ["p(95)<1000"],
    },
};

export default function () {
    const response = http.get("http://localhost:5115/health");

    check(response, {
        "status is 200": (r) => r.status === 200,
        "response received": (r) => r.body && r.body.length > 0,
    });

    sleep(1);
}
