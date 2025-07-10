import React from "react";

/**
 * <Img src={require("path")} height={100} width={100} alt="image" />
 */
export const Image = ({ src, height, width, alt }) => {
  console.log(src);
  return (
    <div>
      <img
        src={src?.default}
        height={height}
        width={width}
        alt={alt}
        style={{ display: "flex", justifySelf: "center" }}
      />
    </div>
  );
};
