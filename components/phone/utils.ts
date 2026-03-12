import { Player, Tweet } from '../../types';

// This recursive function finds a tweet by ID (including in comments and retweets) and applies a modification.
export const findAndModifyTweet = (
    tweets: Tweet[],
    tweetId: string,
    modification: (tweet: Tweet) => Partial<Tweet> | { newComment: Tweet } | { comments: Tweet[] },
    player: Player
): { modifiedTweets: Tweet[], modified: boolean } => {
    let modified = false;
    const modifiedTweets = tweets.map(tweet => {
        if (tweet.id === tweetId) {
            modified = true;
            const changes = modification(tweet);
            if ('newComment' in changes && changes.newComment) {
                // To add a new comment, we need to handle it properly
                 const newComments = changes.newComment.author === player.name
                    ? [changes.newComment, ...tweet.comments] // Player comments go to the top
                    : [...tweet.comments, changes.newComment]; // AI replies go to the bottom
                return { ...tweet, comments: newComments };
            }
             if ('comments' in changes) {
                return { ...tweet, comments: changes.comments };
            }
            return { ...tweet, ...changes };
        }
        
        let newComments = tweet.comments;
        if (tweet.comments && tweet.comments.length > 0) {
            const result = findAndModifyTweet(tweet.comments, tweetId, modification, player);
            if(result.modified) {
                modified = true;
                newComments = result.modifiedTweets;
            }
        }

        let newRetweetOf = tweet.retweetOf;
        if (tweet.retweetOf) {
             const result = findAndModifyTweet([tweet.retweetOf], tweetId, modification, player);
             if(result.modified) {
                modified = true;
                newRetweetOf = result.modifiedTweets[0];
            }
        }
        return { ...tweet, comments: newComments, retweetOf: newRetweetOf };
    });
    return { modifiedTweets, modified };
};