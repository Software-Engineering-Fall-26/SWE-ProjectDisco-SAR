import "./pages.css"

function AddIdea(){
    return(<input
        type="button"
        value="Add Idea"
        className="add-idea-button"
      />);
}

function DeleteIdea(){
    return(<input
        type="button"
        value="Delete Idea"
        className="delete-idea-button"
      />);
}

function EditIdea(){
    return(<input
        type="button"
        value="Edit Idea"
        className="edit-idea-button"
      />);
}

function AccountView(){
    return(<input
        type="button"
        value="View Account"
        className="view-account-button"
      />);
}


function Landing(){
    return(
        <div className="left-box">

            <div className="top-buttons">
                <AddIdea />
                <DeleteIdea />
                <EditIdea />
            </div>

            <div className="bottom-button">
                <AccountView />
            </div>

        </div>
    );
}

export default Landing;