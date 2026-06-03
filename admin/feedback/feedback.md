# Team 10 Feedback
## Strengths
- Event validation system is very intuitive. Event class checks event type, timestamp, deployment data, user ID, URL, browser info, and metadata before saving the event. This is a good habit because observability tools can receive messy or malformed data.
- The database schema is simple and readable. Separating users, events, and uptime_log makes sense for the current scope of the project.
- Effective use of issue tracking and organization, it looks like many issues are being created at the beginning of the sprint for the team to work through over the week
- Multiple README files in different directories helps follow along with the file structure and understand how to run/debug program

- Evidence of agile process can be seen throughout the repo (branches and pull requests, CI/CD, backlog items and sprint overviews/meetings, unit and e2e testing, conventional commits)
 - README does a good job of giving a project overview, explaining the repo structure and how to use it
- Good use of issues tags, almost all of them are assigned and every issue has a tag
- Love the tree view of the repo, super easy to read and know where everything is
- All the documents are placed in the right directory which is easy for others to look through. The wireframe gives a big picture of the dashboard design and workflow. The appropriate testing is implemented in each part of the code

## Improvements
- Clearer route handling. May help to require a specific endpoint like /api/events or /api/log.
- More tests. Since the Event validation logic is central to the project, unit tests for valid/invalid events would be especially useful.
- Definition of Done (DoD) seems to be referring to overall project instead of individual stories. Might want to include specifications for code quality, testing, documentation, etc. to be fulfilled per task or every time there’s a PR
- Splitting tracker.js into a directory to improve legibility and maintenance. This file is the heart of data collection and would be nice to make it easier to scale/maintain.
- A sizeable chunk of the closed issues 40% have no comments. There are also way less closed pull requests than closed issues. Hard to understand where these issues were dealt with, references should be bidirectional (should see the linked PR/commit that fixes the issue in the comments).
- Some PRs can be more descriptive/broken down into more specific feature branches
  - For example, you have “Feat/dashboard prototype”(59) and “dashboard prototype”(46), but it’s not as easy to tell at first glance what they each do and how they accomplish different things from each other because the PRs don’t really have too much descriptions if at all(you kind of have to go through the commit history to understand what’s going on)
  - However, since there can sometimes be a lot of commits in the same PR, you could alternatively break those branches further down into specific feature branches so there are better descriptions and reviewers won’t be super overwhelmed by +1000 lines of code to skim
- Repository Structure in README is not update to with current repo structure
- There is no authentication key that limits access of the unauthorized user. There needs to be an update on the prototype readme
- Pull requests don’t include details and are vague

## Questions
- The GENAI usage doc seems to have only two entries on it surprisingly, is your team not really using AI that much? 
- Given any existing codebase, how can you inject tracker.js to start collecting data? Will it require an init or does it startup automatically?
- Are there any plans to see more than just critical failures? What if one page is failing but others are loading just fine? Also what is a check cycle/how long? Since it’s a ping, what about endpoints that don’t allow it for security reasons?
- What kind of web servers will this work for? Does it need to be on the same endpoint where the server is hosted, or can it be anywhere?
- How would you deal with an unauthorized access or an attempt of sql injection by hackers.
- Do you plan to make a mobile version of the dashboard? If yes, is that within the scope of this project for this class? If not, is that a deliberate decision?
## Suggestions
- ADRs look good but you could maybe include a couple more for important decisions you’ve made (e.g. will changelog be automated or manual or a mix of both, what frameworks did you choose for unit/e2e tests, what is your team/repo’s code style guide?)
- It doesn’t seem like your team has a PR template, it could be useful to have one with a checklist of things to give teammates a reminder of Definition of Done
  - Also helps with describing what the PR is actually addressing, what it accomplishes, etc. 
- Somewhat hard to find how you split your team up (found this in sprint docs), maybe include this in your README or another big architectural doc 
- Commit history doesn’t line up with changelog, there’s a single entry that hasn’t been updated in almost 2 weeks, surely more features/patches have been pushed since the 11th.
- GenAI.md, does it need to be in the main folder? Feel like it would be better placed in docs somewhere so it doesn’t crowd your main page.
- It was a bit hard to find the codes for the server, maybe rename some of the directories and codes in more intuitive way?

## What to implement?
- A repo structure in our README
- A “how to run” section in our README
- A “issues running?” section in the README