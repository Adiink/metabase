git reset HEAD~1
rm ./backport.sh
git cherry-pick 6421b4187e3da0df3c170e1ff3e4e58280fd917b
echo 'Resolve conflicts and force push this branch.\n\nTo backport translations run: bin/i18n/merge-translations <release-branch>'
