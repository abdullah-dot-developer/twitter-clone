import { useEffect } from "react";
import PostSkeleton from "../../components/sketletons/PostSkeleton";
import Post from "./Post";
import { useQuery } from "@tanstack/react-query";

const Posts = ({ feedType, username, userId }) => {
  // console.log(feedType);
  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return {
          url: "http://localhost:8000/api/posts/all",
          options: {
            method: "GET",
            credentials: "include",
          },
        };
      case "following":
        return {
          url: "http://localhost:8000/api/posts/following",
          options: {
            method: "GET",
            credentials: "include",
          },
        };
      case "posts":
        return {
          url: `http://localhost:8000/api/posts/user/${username}`,
          options: {
            method: "GET",
            credentials: "include",
          },
        };
      case "likes":
        return {
          url: `http://localhost:8000/api/posts/likes/${userId}`,
          options: {
            method: "GET",
            credentials: "include",
          },
        };
      default:
        return {
          url: "http://localhost:8000/api/posts/all",
          options: {
            method: "GET",
            credentials: "include",
          },
        };
    }
  };

  const { url, options } = getPostEndpoint();
  // console.log(url, options);

  const {
    data: posts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        const res = await fetch(url, options);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  useEffect(() => {
    refetch();
  }, [feedType, refetch, username]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && posts?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isRefetching && posts && (
        <div>
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </>
  );
};
export default Posts;
