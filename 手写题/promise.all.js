function promiseAll(array) {
  return new Promise((resolve, reject) => {
    if (!(array instanceof Array)) {
      reject(new Error("params is not a valid array"));
    }
    let resultArr = new Array(array.length),
      count = 0;
    for (let i = 0; i < array.length; i++) {
      Promise.resolve(array[i])
        .then((res) => {
          resultArr[i] = res;
          count++;
          if (count === array.length) {
            resolve(resultArr);
          }
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
}
