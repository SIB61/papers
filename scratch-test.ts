const save = async (isPublishing: boolean = false) => {
  console.log("isPublishing:", isPublishing);
};

const onKeyDown = () => {
  void save();
};

onKeyDown();
