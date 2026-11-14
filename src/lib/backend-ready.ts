let ready: Promise<void> = Promise.resolve()

export function setBackendReady(promise: Promise<void>) {
  ready = promise
  // Consumers still receive the rejection, including when startup fails early.
  void ready.catch(() => {})
}

export function whenBackendReady() { return ready }
