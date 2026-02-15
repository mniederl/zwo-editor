export interface RunningTimes {
  oneMile: string | undefined;
  fiveKm: string | undefined;
  tenKm: string | undefined;
  halfMarathon: string | undefined;
  marathon: string | undefined;
}

export const loadRunningTimes = (): RunningTimes => {
  const missingRunningTimes: RunningTimes = {
    oneMile: "",
    fiveKm: "",
    tenKm: "",
    halfMarathon: "",
    marathon: "",
  };
  const runningTimesJson = localStorage.getItem("runningTimes");
  if (runningTimesJson) {
    return JSON.parse(runningTimesJson);
  }

  // Fallback to old localStorage keys
  const oneMile = localStorage.getItem("oneMileTime") || "";
  const fiveKm = localStorage.getItem("fiveKmTime") || "";
  const tenKm = localStorage.getItem("tenKmTime") || "";
  const halfMarathon = localStorage.getItem("halfMarathonTime") || "";
  const marathon = localStorage.getItem("marathonTime") || "";
  if (oneMile || fiveKm || tenKm || halfMarathon || marathon) {
    return { oneMile, fiveKm, tenKm, halfMarathon, marathon };
  }

  return missingRunningTimes;
};
